import { Resolvers } from "@/.generated/graphql";
import { env } from "@/env.mjs";
import { chatModel, searchSimilarContent } from "@/lib/ai";
import { Posts, getContent, ContentType, Locale, ContentWithId } from "@/lib/data";
import { lastfm } from "@/lib/lastfm";
import { GraphQLResolveInfo } from 'graphql';
import { countBy, groupBy, map } from "lodash";
import type { Context } from './context';
import { generateText, streamText, tool } from 'ai';
import { z } from 'zod';
import { isProduction } from "@/lib/utils";
import { checkRateLimit, isUserBlocked } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { chatMessages, chatSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getMessageCount, createVerificationToken } from "@/lib/auth";
import { FREE_MESSAGE_LIMIT } from "@/lib/constants";
import { sendMagicLinkEmail } from "@/lib/email";
import { getPromptWithParams, getDefaultPromptParams } from "@/lib/prompts";
import { createHash } from 'crypto';

// Helper type for posts with _id
type PostsWithId = ContentWithId<Posts>;

// Helper function to hash email for rate limiting (prevents PII leakage)
function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

// Define tools for the AI assistant
const createTools = (locale: Locale) => ({
  searchContent: tool({
    description: 'Search the blog content for relevant information about posts, paintings, and pages. Use this tool to find specific information before answering questions.',
    inputSchema: z.object({
      query: z.string().describe('The search query to find relevant content'),
      limit: z.number().optional().default(5).describe('Maximum number of results to return')
    }),
    execute: async ({ query, limit }) => {
      const results = await searchSimilarContent(query, limit);
      if (results.length === 0) {
        return 'No relevant content found.';
      }
      return results.map((r: any, i: number) =>
        `[Result ${i + 1}]\n${r.content}\n---`
      ).join('\n\n');
    }
  }),

  navigateToPost: tool({
    description: 'Provide a clickable navigation link to a specific blog post. Use when user wants to read a post.',
    inputSchema: z.object({
      slug: z.string().describe('The post slug/URL path')
    }),
    execute: ({ slug }) => {
      return `[NAVIGATE:/posts/${slug}]`;
    }
  }),

  navigateToPainting: tool({
    description: 'Provide a clickable navigation link to a specific painting. Use when user wants to view a painting.',
    inputSchema: z.object({
      slug: z.string().describe('The painting slug/URL path')
    }),
    execute: ({ slug }) => {
      return `[NAVIGATE:/paintings/${slug}]`;
    }
  }),

  navigateToTag: tool({
    description: 'Provide a clickable navigation link to view all content with a specific tag.',
    inputSchema: z.object({
      tag: z.string().describe('The tag name')
    }),
    execute: ({ tag }) => {
      return `[NAVIGATE:/tags/${tag}]`;
    }
  }),

  listRecentPosts: tool({
    description: 'Get a list of recent blog posts with titles and summaries.',
    inputSchema: z.object({
      limit: z.number().optional().default(5).describe('Number of posts to return')
    }),
    execute: ({ limit }) => {
      const posts = getContent([], ContentType.POST, locale);
      const recentPosts = posts.slice(0, limit);
      return recentPosts.map((p: any) =>
        `- **${p.title}** [NAVIGATE:${p.slug}]\n  ${p.description || 'No description'}`
      ).join('\n\n');
    }
  }),

  listPaintings: tool({
    description: 'Get a list of paintings in the gallery.',
    inputSchema: z.object({
      limit: z.number().optional().default(5).describe('Number of paintings to return')
    }),
    execute: ({ limit }) => {
      const paintings = getContent([], ContentType.PAINTING, locale);
      const recentPaintings = paintings.slice(0, limit);
      return recentPaintings.map((p: any) =>
        `- **${p.title}** by ${p.author || 'Unknown'} [NAVIGATE:${p.slug}]\n  ${p.description || 'No description'}`
      ).join('\n\n');
    }
  }),

  listPopularTags: tool({
    description: 'Get a list of popular/available tags in the blog.',
    inputSchema: z.object({}),
    execute: () => {
      const posts = getContent([], ContentType.POST, locale);
      const tagCounts = posts.reduce((acc: Record<string, number>, post: any) => {
        post.tags?.forEach((tag: string) => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {});

      return Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => `- ${tag} (${count} posts) [NAVIGATE:/tags/${tag}]`)
        .join('\n');
    }
  }),

  searchAuthorContent: tool({
    description: 'Search for content by Abdul Hamid, the blog author. Use this to find his posts, thoughts, and writings.',
    inputSchema: z.object({
      query: z.string().describe('Search query related to Abdul Hamid or his content')
    }),
    execute: async ({ query }) => {
      const results = await searchSimilarContent(`Abdul Hamid ${query}`, 5);
      if (results.length === 0) {
        return 'No content found by Abdul Hamid matching that query.';
      }
      return results.map((r: any, i: number) =>
        `[Result ${i + 1}]\n${r.content}\n---`
      ).join('\n\n');
    }
  }),

  ...(isProduction ? {} : {
    debugContent: tool({
      description: 'Debug tool to see what content is available. Use this to troubleshoot content detection issues.',
      inputSchema: z.object({
        type: z.string().optional().describe('Content type to debug: posts, paintings, or pages')
      }),
      execute: ({ type }) => {
        if (type === 'paintings') {
          const paintings = getContent([], ContentType.PAINTING, locale);
          return `Available paintings (${paintings.length}):\n${paintings.slice(0, 5).map((p: any, i: number) =>
            `${i + 1}. ${p.title} - slugAsParams: "${p.slugAsParams}", slug: "${p.slug}"`
          ).join('\n')}`;
        } else if (type === 'posts') {
          const posts = getContent([], ContentType.POST, locale);
          return `Available posts (${posts.length}):\n${posts.slice(0, 5).map((p: any, i: number) =>
            `${i + 1}. ${p.title} - slugAsParams: "${p.slugAsParams}", slug: "${p.slug}"`
          ).join('\n')}`;
        } else {
          const allContent = getContent([], undefined, locale);
          return `All content (${allContent.length}):\n${allContent.slice(0, 10).map((c: any, i: number) =>
            `${i + 1}. ${c.title} (${c.type}) - slugAsParams: "${c.slugAsParams}", slug: "${c.slug}"`
          ).join('\n')}`;
        }
      }
    }),
  }),

  getCurrentPageContent: tool({
    description: 'Get detailed information about the page the user is currently viewing. Use this when the user asks about "this post", "this painting", or "the current page". CRITICAL: You must use the exact currentPageUrl provided in the system prompt (e.g., "/posts/city-a-poem-from-vladimir-kotlyarov"), NOT generic URLs like "/current-page".',
    inputSchema: z.object({
      url: z.string().describe('The current page URL path - MUST be the exact currentPageUrl from the system prompt (e.g., "/posts/city-a-poem-from-vladimir-kotlyarov")')
    }),
    execute: async ({ url }) => {
      try {
        if (!isProduction) {
          console.log('🔍 getCurrentPageContent called with URL:', url);
          console.log('🔍 Current locale:', locale);

          // Warn if AI is using a generic URL instead of the actual page URL
          if (url === '/current-page' || url === 'current-page') {
            console.warn('⚠️ AI is using generic URL "/current-page" instead of the actual page URL. This suggests the AI is not properly reading the currentPageUrl from the system prompt.');
          }

          // Debug: show what content is available
          const allContent = getContent([], undefined, locale);
          console.log('🔍 Total content available:', allContent.length);
          console.log('🔍 Sample content:', allContent.slice(0, 3).map(c => ({ title: c.title, type: c.type, slugAsParams: c.slugAsParams })));
        }


        // Parse URL to extract content type and slug
        // URLs can be like: /posts/slug, /paintings/slug, /about, or with locale: /en/posts/slug
        let urlParts = url.split('/').filter(p => p);

        if (!isProduction) {
          console.log('📍 URL parts:', urlParts);
        }

        if (urlParts.length === 0) {
          return 'User is on the homepage.';
        }

        // Check if first part is a locale (en, es, ru) and skip it
        const locales = ['en', 'es', 'ru'];
        if (locales.includes(urlParts[0])) {
          urlParts = urlParts.slice(1);
        }

        const contentType = urlParts[0]; // 'posts', 'paintings', or page name
        const slug = urlParts.slice(1).join('/'); // rest of the path

        // The full slug including content type (e.g., "posts/my-post")
        const fullSlug = urlParts.join('/');

        let content: any = null;

        if (contentType === 'posts' && slug) {
          const posts = getContent([], ContentType.POST, locale);
          if (!isProduction) {
            console.log(`🔍 Searching for post with slug: "${slug}" or fullSlug: "${fullSlug}"`);
            console.log(`📚 Available post slugs:`, posts.slice(0, 3).map((p: any) => ({ slugAsParams: p.slugAsParams, slug: p.slug })));
          }
          // Try both with and without the content type prefix
          content = posts.find((p: any) =>
            p.slugAsParams === slug ||
            p.slugAsParams === fullSlug ||
            p.slug === `/${slug}` ||
            p.slug === `/${fullSlug}`
          );

          // Fallback: try partial matching if exact match fails
          if (!content) {
            content = posts.find((p: any) =>
              p.slugAsParams?.includes(slug) ||
              p.slug?.includes(slug) ||
              p.title?.toLowerCase().includes(slug.toLowerCase())
            );
          }
        } else if (contentType === 'paintings' && slug) {
          const paintings = getContent([], ContentType.PAINTING, locale);
          if (!isProduction) {
            console.log(`🔍 Searching for painting with slug: "${slug}" or fullSlug: "${fullSlug}"`);
            console.log(`📚 Available painting slugs:`, paintings.slice(0, 3).map((p: any) => ({ slugAsParams: p.slugAsParams, slug: p.slug })));
          }
          content = paintings.find((p: any) =>
            p.slugAsParams === slug ||
            p.slugAsParams === fullSlug ||
            p.slug === `/${slug}` ||
            p.slug === `/${fullSlug}`
          );

          // Fallback: try partial matching if exact match fails
          if (!content) {
            content = paintings.find((p: any) =>
              p.slugAsParams?.includes(slug) ||
              p.slug?.includes(slug) ||
              p.title?.toLowerCase().includes(slug.toLowerCase())
            );
          }
        } else {
          const pages = getContent([], ContentType.PAGE, locale);
          if (!isProduction) {
            console.log(`🔍 Searching for page with slug: "${contentType}"`);
          }
          content = pages.find((p: any) =>
            p.slugAsParams === contentType ||
            p.slug === `/${contentType}`
          );
        }

        if (!content) {
          if (!isProduction) {
            console.warn(`⚠️ Content not found for URL: ${url}`);
            console.warn(`📍 Parsed parts - contentType: "${contentType}", slug: "${slug}"`);
            console.warn(`📍 Full slug: "${fullSlug}"`);
          }

          // Last resort: try to find content using search
          try {
            const searchResults = await searchSimilarContent(slug || contentType, 1);
            if (searchResults.length > 0) {
              const foundContent = searchResults[0];
              return `User is viewing a page at ${url}. Found related content: ${foundContent.content.substring(0, 200)}...`;
            }
          } catch (error) {
            console.error('Error in fallback search:', error);
          }

          // Even if we can't find specific content, return basic page info
          return `User is currently viewing the ${contentType || 'page'} at ${url}. This appears to be ${contentType === 'about' ? 'the About page' : `a ${contentType} page`} on Abdul Hamid's blog.`;
        }

        if (!isProduction) {
          console.log('✅ Found content:', content.title);
        }

        const info = [
          `**Current Page: ${content.title}**`,
          content.description ? `Description: ${content.description}` : '',
          content.type ? `Type: ${content.type}` : '',
          content.author ? `Author: ${content.author}` : '',
          content.year ? `Year: ${content.year}` : '',
          content.tags ? `Tags: ${content.tags.join(', ')}` : '',
          content.body?.raw ? `\nContent:\n${content.body.raw.substring(0, 1000)}...` : ''
        ].filter(Boolean).join('\n');

        if (!isProduction) {
          console.log('📄 Tool returning content info:', info.substring(0, 200) + '...');
        }

        return info;
      } catch (error) {
        console.error('Error in getCurrentPageContent tool:', error);
        return `Error retrieving page content for ${url}. Please try again or provide more specific information about what you're looking for.`;
      }
    }
  })
});

// Ensure chat session exists in database
async function ensureChatSession(sessionId: string, userId: string | null = null) {
  try {
    // Check if session exists
    const existing = await db.select()
      .from(chatSessions)
      .where(eq(chatSessions.sessionId, sessionId))
      .limit(1);

    if (existing.length === 0) {
      // Create new session
      await db.insert(chatSessions).values({
        sessionId,
        userId
      });
    }
  } catch (error) {
    // Silently fail - chat works without DB
    if (!isProduction) {
      console.log('ℹ️ Chat session not persisted');
    }
  }
}

// Save chat message to database (optional - tables may not exist yet)
async function saveChatMessage(sessionId: string, role: string, content: string, tokens?: number) {
  try {
    await db.insert(chatMessages).values({
      sessionId,
      role,
      content,
      tokens: tokens || null
    });
  } catch (error) {
    // Silently fail if tables don't exist yet - chat still works without persistence
    if (!isProduction) {
      console.log('ℹ️ Chat messages not persisted');
    }
  }
}

// Summarize conversation when it gets too long (optional - requires DB tables)
async function summarizeConversation(sessionId: string) {
  try {
    const messages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(10);

    if (messages.length < 10) return;

    const conversationText = messages
      .reverse()
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const { text: summary } = await generateText({
      model: chatModel,
      prompt: `Summarize this conversation concisely, preserving key information:\n\n${conversationText}`
    });

    // Delete old messages
    await db.delete(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId));

    // Insert summary as system message
    await saveChatMessage(sessionId, 'system', `Previous conversation summary: ${summary}`);

    if (!isProduction) {
      console.log(`📝 Summarized conversation for session ${sessionId}`);
    }
  } catch (error) {
    // Silently fail if tables don't exist - summarization is optional
    if (!isProduction) {
      console.log('ℹ️ Conversation summarization skipped (run migrations to enable)');
    }
  }
}

function groupByMonth(posts: PostsWithId) {
  return groupBy(posts, (post) => {
    const date = new Date(post.date || "")
    return `${date.getFullYear()}-${date.getMonth() + 1}`
  })
}

function categorizeReadingTime(posts: PostsWithId) {
  return countBy(posts, (post) => {
    const time = post.readingTime.minutes
    if (time < 2) return "0-2 minutes"
    if (time < 5) return "2-5 minutes"
    if (time < 10) return "5-10 minutes"
    return "10+ minutes"
  })
}

// Input validation schema for GraphQL chat mutation (mirrors streaming endpoint)
const chatInputSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().uuid(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(4000)
  })).max(50).default([]),
  currentPageUrl: z.string().max(500).optional()
});

const resolvers: Resolvers = {
  Mutation: {
    async chat(root, { input }, context: Context, info: GraphQLResolveInfo) {
      // Validate input to prevent cost-escalation attacks
      const validated = chatInputSchema.safeParse(input);
      if (!validated.success) {
        throw new Error('Invalid input: ' + validated.error.issues.map(i => i.message).join(', '));
      }
      const { message, sessionId, history = [], currentPageUrl } = validated.data;
      const userLocale = context.locale as Locale;
      const user = context.user;

      // Check if user is authenticated
      if (user.isAuthenticated) {
        // Authenticated users can chat freely
        const userId = user.id;

        // Check if user is blocked
        if (await isUserBlocked(userId)) {
          throw new Error('Access denied. You have been blocked from using the chat.');
        }

        // Check rate limits
        const rateLimitResult = await checkRateLimit(userId);
        if (!rateLimitResult.allowed) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      } else {
        // Unauthenticated users - check message count
        const messageCount = await getMessageCount(sessionId);

        if (messageCount >= FREE_MESSAGE_LIMIT) {
          // Check if this is an email submission
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(message.trim())) {
            // User provided email, send magic link
            try {
              const token = await createVerificationToken(message.trim());
              await sendMagicLinkEmail(message.trim(), token);

              return {
                message: `📧 I've sent a verification link to ${message.trim()}. Please check your email and click the link to continue chatting!`,
                usage: {
                  promptTokens: 0,
                  completionTokens: 0,
                  totalTokens: 0
                }
              };
            } catch (error) {
              console.error('Error sending magic link:', error);
              return {
                message: `❌ Sorry, I couldn't send the verification email. Please try again or contact support.`,
                usage: {
                  promptTokens: 0,
                  completionTokens: 0,
                  totalTokens: 0
                }
              };
            }
          } else {
            // User hasn't provided email yet, show auth prompt
            return {
              message: `🔒 You've used all ${FREE_MESSAGE_LIMIT} free messages! To continue chatting, please provide your email address and I'll send you a magic link to verify your identity.\n\nJust type your email address in the chat.`,
              usage: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0
              }
            };
          }
        }

        // User has messages remaining, use temporary ID for rate limiting
        const tempUserId = `session-${sessionId}`;

        // Check if user is blocked
        if (await isUserBlocked(tempUserId)) {
          throw new Error('Access denied. You have been blocked from using the chat.');
        }

        // Check rate limits
        const rateLimitResult = await checkRateLimit(tempUserId);
        if (!rateLimitResult.allowed) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      }

      // Create locale-aware tools
      const tools = createTools(userLocale);

      // Load personality prompt dynamically
      const defaultParams = getDefaultPromptParams();
      const systemPrompt = getPromptWithParams('smerdyakov-personality', userLocale, defaultParams);

      if (!systemPrompt) {
        console.warn('⚠️ System prompt is empty, using fallback');
      }

      // Add current page context if available
      let finalSystemPrompt = systemPrompt;
      if (currentPageUrl) {
        const pageContextPrompt = getPromptWithParams('page-context', userLocale, {
          ...defaultParams,
          currentPageUrl
        });
        if (pageContextPrompt) {
          finalSystemPrompt += `\n\n${pageContextPrompt}`;
        } else {
          // Fallback if page-context prompt not found
          console.warn('⚠️ Page context prompt not found, using fallback');
          finalSystemPrompt += `\n\nIMPORTANT: The user is currently viewing this page: ${currentPageUrl}. 

When the user asks about "this page", "this post", "this article", or anything about what they're currently reading, you MUST call the getCurrentPageContent tool with the EXACT URL "${currentPageUrl}" (not /current-page or any other URL).

Example: If user asks "what's this about?" or "tell me about this post", call getCurrentPageContent with url: "${currentPageUrl}"

This is critical for providing relevant context about what they're actually viewing.`;
        }
      }

      // Build conversation history  
      const messages: any[] = [
        {
          role: 'system',
          content: finalSystemPrompt
        },
        ...(history || []).map((h: any) => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ];

      try {
        // Determine user ID for session
        const userId = user.isAuthenticated ? user.id : `session-${sessionId}`;

        // Ensure session exists in database before saving messages
        await ensureChatSession(sessionId, userId);

        // Generate response with tools
        if (!isProduction) {
          console.log('🔧 Available tools:', Object.keys(tools));
          console.log('🔧 Current page URL:', currentPageUrl);
        }

        const result = await generateText({
          model: chatModel,
          messages,
          tools
        });

        if (!result) {
          throw new Error('AI generation returned null result');
        }

        // Debug logging
        if (!isProduction) {
          console.log('🔍 AI Result:', {
            text: result.text,
            textLength: result.text.length,
            toolCalls: result.toolCalls?.length || 0,
            toolResults: result.toolResults?.length || 0,
            steps: result.steps?.length || 0,
            response: result.response
          });

          if (result.toolCalls && result.toolCalls.length > 0) {
            console.log('🔧 Tool calls made:', result.toolCalls.map(tc => ({ name: tc?.toolName })));
          }

          if (result.toolResults && result.toolResults.length > 0) {
            console.log('🔧 Tool results:', result.toolResults.map(tr => ({ toolName: tr?.toolName })));
          }
        }

        // Get the full response text
        let fullResponse = result.text;

        // Safety check: if response is empty but we have tool results, make a follow-up call
        if (!fullResponse || fullResponse.trim().length === 0) {
          if (!isProduction) {
            console.warn('⚠️ Empty response from AI, attempting follow-up generation...');
          }

          // If we have tool results, try a follow-up generation with the results
          if (result.toolResults && result.toolResults.length > 0) {
            const toolResultsText = result.toolResults
              .map((tr: any) => {
                if (!tr || !tr.toolName) {
                  console.warn('⚠️ Invalid tool result:', tr);
                  return null;
                }
                const resultData = tr.result || tr.resultText || tr.content || 'No result data';
                if (!isProduction) {
                  console.log(`🔧 Tool result for ${tr.toolName}:`, typeof resultData, resultData?.substring?.(0, 100) || resultData);
                }
                return `Tool: ${tr.toolName}\nResult: ${resultData}`;
              })
              .filter(Boolean)
              .join('\n\n');

            if (toolResultsText && !isProduction) {
              console.log('📋 Tool Results:', toolResultsText);
            } else if (!toolResultsText) {
              console.warn('⚠️ No valid tool results found');
            }

            // Make a follow-up call without tools to force text generation
            try {
              const followUpResult = await generateText({
                model: chatModel,
                messages: [
                  ...messages,
                  {
                    role: 'assistant',
                    content: `I've gathered the following information using my tools:\n\n${toolResultsText}\n\nNow I'll provide a helpful response to the user.`
                  },
                  {
                    role: 'user',
                    content: `Based on the information you gathered about the current page, please provide me with a helpful and conversational response. The user asked: "${message}". Use the tool results to give a specific, relevant answer.`
                  }
                ],
                system: `You are Smerdyakov, a philosophical chat assistant. You MUST provide a conversational response based on the tool results. Never leave your response empty. Be helpful and engaging while maintaining your characteristic analytical tone.`
              });

              fullResponse = followUpResult.text;
              if (!isProduction) {
                console.log('✅ Follow-up response generated:', fullResponse.substring(0, 100) + '...');
              }
            } catch (error) {
              console.error('Follow-up generation failed:', error);
              fullResponse = `Based on the information I found:\n\n${toolResultsText}`;
            }
          }

          // Last resort: provide a generic error message
          if (!fullResponse || fullResponse.trim().length === 0) {
            fullResponse = "I apologize, but I wasn't able to generate a proper response. Could you please rephrase your question?";
          }
        }

        // Get usage info
        const usage = result.usage;

        // Save to database
        const promptTokens = 'promptTokens' in usage ? (usage.promptTokens as number) : ('inputTokens' in usage ? (usage as any).inputTokens : 0);
        const completionTokens = 'completionTokens' in usage ? (usage.completionTokens as number) : ('outputTokens' in usage ? (usage as any).outputTokens : 0);

        await saveChatMessage(sessionId, 'user', message, promptTokens);
        await saveChatMessage(sessionId, 'assistant', fullResponse, completionTokens);

        // Summarize if history > 10 messages
        if (history && history.length > 10) {
          await summarizeConversation(sessionId);
        }

        if (!isProduction) {
          console.log(`💬 Chat response generated. Tokens: ${usage.totalTokens}`);
        }

        return {
          message: fullResponse,
          usage: {
            promptTokens,
            completionTokens,
            totalTokens: usage.totalTokens || 0
          }
        };
      } catch (error) {
        console.error('Error in chat mutation:', error);
        throw new Error('Failed to generate response. Please try again.');
      }
    },

    async requestMagicLink(root: any, { email }: { email: string }, context: Context) {
      try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return {
            success: false,
            message: 'Please provide a valid email address.'
          };
        }

        // Rate limit magic link requests by email to prevent email bombing
        // Hash the email to prevent PII leakage in rate limit datastore/logs
        const rateLimitResult = await checkRateLimit(`magic-link:${hashEmail(email)}`, 'chat');
        if (!rateLimitResult.allowed) {
          return {
            success: false,
            message: 'Too many requests. Please wait a few minutes before requesting another verification link.'
          };
        }

        // Create verification token
        const token = await createVerificationToken(email);

        // Send magic link email
        await sendMagicLinkEmail(email, token);

        return {
          success: true,
          message: 'Verification link sent. Please check your email and click the link to continue chatting.'
        };
      } catch (error) {
        console.error('Error in requestMagicLink:', error);
        return {
          success: false,
          message: 'Failed to send verification email. Please try again.'
        };
      }
    }
  },
  Query: {
    posts(root, args, context, info: GraphQLResolveInfo) {
      const { locale } = context
      return getContent([], ContentType.POST, locale as Locale)
    },

    paintings(root, args, context: Context, info: GraphQLResolveInfo) {
      const { locale } = context;
      return getContent([], ContentType.PAINTING, locale as Locale)
    },

    pages(root, args, context: Context, info: GraphQLResolveInfo) {
      const { locale } = context
      return getContent([], ContentType.PAGE, locale as Locale)
    },

    content(root, args, context: Context, info: GraphQLResolveInfo) {
      const { locale } = context
      return getContent([], undefined, locale as Locale)
    },

    postsOverTime(root, args, context: Context, info: GraphQLResolveInfo) {
      const { locale } = context
      const posts = getContent([], ContentType.POST, locale as Locale) as PostsWithId
      const groupedPosts = groupByMonth(posts)
      const items = map(groupedPosts, (posts, month) => ({
        month,
        count: posts.length,
      }))
      // Sort by YYYY-M or YYYY-MM lexical order
      return items.sort((a, b) => a.month.localeCompare(b.month))
    },

    readingTimeDistribution(
      root,
      args,
      context: Context,
      info: GraphQLResolveInfo
    ) {
      const { locale } = context
      const posts = getContent([], ContentType.POST, locale as Locale) as PostsWithId
      const distribution = categorizeReadingTime(posts)
      const items = map(distribution, (count, category) => ({
        category,
        count,
      }))
      const order = ["0-2 minutes", "2-5 minutes", "5-10 minutes", "10+ minutes"]
      return items.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))
    },

    async search(root, { query, k = 5, locale }, context: Context, info: GraphQLResolveInfo) {
      const foundContent = await searchSimilarContent(query, k!);
      const ids = [...new Set(foundContent.map(result => result.id))] as string[];
      const searchLocale = (locale || context.locale) as Locale;
      const results = getContent(ids, undefined, searchLocale)
      const count = results.length
      return {
        results,
        count
      };
    },

    async answer(root, { question, k = 5 }, context: Context, info: GraphQLResolveInfo) {
      try {
        const userLocale = context.locale as Locale;
        const tools = createTools(userLocale);

        // Use the AI to answer the question with RAG
        const result = await generateText({
          model: chatModel,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant. Use the searchContent tool to find relevant information and provide a comprehensive answer.'
            },
            { role: 'user', content: question }
          ],
          tools
        });

        // Get the answer
        const answer = result.text;

        // Get relevant content for display
        const foundContent = await searchSimilarContent(question, k!);
        const ids = [...new Set(foundContent.map(result => result.id))] as string[];
        const results = getContent(ids, undefined, context.locale as Locale);

        return {
          question,
          answer,
          results,
          count: results.length
        };
      } catch (error) {
        console.error('Error in answer query:', error);
        throw new Error('Failed to generate answer');
      }
    },

    async topArtists() {
      return await lastfm.user.getTopArtists({ username: env.LASTFM_USERNAME })
        .then(response => response.artists.map(artist => ({
          rank: artist.rank,
          name: artist.name,
          scrobbles: artist.scrobbles,
          url: artist.url,
        })));
    },

    async topTracks() {
      return await lastfm.user.getTopTracks({ username: env.LASTFM_USERNAME })
        .then(response => response.tracks.map(track => ({
          rank: track.rank,
          name: track.name,
          stats: {
            duration: track.stats.duration,
            userPlayCount: track.stats.userPlayCount,
          },
          artist: {
            name: track.artist.name,
            url: track.artist.url,
          },
          url: track.url,
        })));
    },

    async topTags() {
      return await lastfm.user.getTopTags({ username: env.LASTFM_USERNAME }).then(response => response.tags);
    },
  },

  Content: {
    __resolveType(obj) {
      if (obj?.type === ContentType.PAGE || obj?.type === ContentType.POST || obj?.type === ContentType.PAINTING) {
        return obj.type;
      }
      return null;
    },
  },
}

export default resolvers
