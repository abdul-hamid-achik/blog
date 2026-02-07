import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser, getMessageCount } from '@/lib/auth';
import { checkRateLimit, isUserBlocked } from '@/lib/rate-limit';
import { chatModel, searchSimilarContent } from '@/lib/ai';
import { getContent, ContentType, Locale } from '@/lib/data';
import { streamText, tool } from 'ai';
import { isProduction } from '@/lib/utils';
import { db } from '@/lib/db';
import { chatMessages, chatSessions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getPromptWithParams, getDefaultPromptParams } from '@/lib/prompts';

// Allowed CORS origins
const ALLOWED_ORIGINS = [
    'https://www.abdulachik.dev',
    'https://abdulachik.dev',
    ...(isProduction ? [] : ['http://localhost:3000']),
];

function getCorsOrigin(request: NextRequest): string {
    const origin = request.headers.get('origin');
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        return origin;
    }
    return ALLOWED_ORIGINS[0];
}

// Input validation schema
const inputSchema = z.object({
    message: z.string().min(1).max(2000),
    sessionId: z.string().uuid(),
    history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string()
    })).max(50),
    currentPageUrl: z.string().optional()
});

// Define tools for the AI assistant (reused from GraphQL resolver)
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

export async function POST(request: NextRequest) {
    try {
        // Parse and validate input
        const body = await request.json();
        const validatedInput = inputSchema.parse(body);
        const { message, sessionId, history = [], currentPageUrl } = validatedInput;

        // Get locale from headers
        const locale = (request.headers.get("locale") || "en") as Locale;

        // Authentication check
        const user = await getAuthenticatedUser();

        if (!user.isAuthenticated) {
            // Check message count for unauthenticated users
            const messageCount = await getMessageCount(sessionId);
            if (messageCount >= 5) {
                return new Response('Authentication required', {
                    status: 401,
                    headers: {
                        'Content-Type': 'text/plain',
                        'X-Content-Type-Options': 'nosniff',
                        'X-Frame-Options': 'DENY'
                    }
                });
            }
        }

        // Determine user ID for rate limiting
        const userId = user.isAuthenticated ? user.id : `session-${sessionId}`;

        // Check if user is blocked
        if (await isUserBlocked(userId)) {
            return new Response('Access denied', {
                status: 403,
                headers: {
                    'Content-Type': 'text/plain',
                    'X-Content-Type-Options': 'nosniff',
                    'X-Frame-Options': 'DENY'
                }
            });
        }

        // Rate limiting (use stream rate limiter for stricter limits)
        const rateLimitResult = await checkRateLimit(userId, 'stream');
        if (!rateLimitResult.allowed) {
            return new Response('Rate limit exceeded', {
                status: 429,
                headers: {
                    'Content-Type': 'text/plain',
                    'X-Content-Type-Options': 'nosniff',
                    'X-Frame-Options': 'DENY',
                    'Retry-After': '60'
                }
            });
        }

        // Ensure session exists in database
        await ensureChatSession(sessionId, user.isAuthenticated ? userId : null);

        // Create locale-aware tools
        const tools = createTools(locale);

        // Load personality prompt dynamically
        const defaultParams = getDefaultPromptParams();
        const systemPrompt = getPromptWithParams('smerdyakov-personality', locale, defaultParams);

        if (!systemPrompt) {
            console.warn('⚠️ System prompt is empty, using fallback');
        }

        // Add current page context if available
        let finalSystemPrompt = systemPrompt;
        if (currentPageUrl) {
            const pageContextPrompt = getPromptWithParams('page-context', locale, {
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

        // Create streaming response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Send initial headers
                    controller.enqueue(encoder.encode('data: {"type":"start"}\n\n'));

                    // Generate streaming response with tools
                    const result = await streamText({
                        model: chatModel,
                        messages,
                        tools,
                        onFinish: async (result) => {
                            // Save complete response to database
                            const promptTokens = 'promptTokens' in result.usage ? (result.usage.promptTokens as number) : 0;
                            const completionTokens = 'completionTokens' in result.usage ? (result.usage.completionTokens as number) : 0;

                            await saveChatMessage(sessionId, 'user', message, promptTokens);
                            await saveChatMessage(sessionId, 'assistant', result.text, completionTokens);

                            if (!isProduction) {
                                console.log(`💬 Streamed chat response completed. Tokens: ${result.usage.totalTokens}`);
                            }
                        }
                    });

                    // Stream the response
                    for await (const delta of result.textStream) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(delta)}\n\n`));
                    }

                    // Send completion signal
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();

                } catch (error) {
                    console.error('Error in streaming chat:', error);
                    controller.enqueue(encoder.encode('data: {"error":"Failed to generate response"}\n\n'));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'Access-Control-Allow-Origin': getCorsOrigin(request),
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });

    } catch (error) {
        console.error('Error in chat stream endpoint:', error);

        if (error instanceof z.ZodError) {
            return new Response('Invalid input', {
                status: 400,
                headers: {
                    'Content-Type': 'text/plain',
                    'X-Content-Type-Options': 'nosniff',
                    'X-Frame-Options': 'DENY'
                }
            });
        }

        return new Response('Internal server error', {
            status: 500,
            headers: {
                'Content-Type': 'text/plain',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY'
            }
        });
    }
}

// Handle preflight requests
export function OPTIONS(request: NextRequest) {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': getCorsOrigin(request),
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    });
}
