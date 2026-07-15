import { Resolvers } from "@/.generated/graphql";
import { env } from "@/env.mjs";
import {
  getCrisisSupportMessage,
  getModerationBlockMessage,
} from "@/lib/chat-safety";
import {
  conciergeModel,
  getConciergeProviderOptions,
  searchSimilarContent,
} from "@/lib/ai";
import {
  Posts,
  getContent,
  ContentType,
  Locale,
  ContentWithId,
} from "@/lib/data";
import { lastfm } from "@/lib/lastfm";
import { ModerationResult, moderateInput } from "@/lib/moderation";
import {
  findProjects,
  formatCurrentProjectContext,
  formatProjectSearchResults,
  getCurrentProjects,
  isCurrentProjectQuery,
} from "@/lib/project-search";
import { getLocalizedPath } from "@/lib/site-url";
import { countBy, groupBy, map } from "lodash";
import type { Context } from "./context";
import type { ModelMessage } from "ai";
import { generateText, isStepCount, tool } from "ai";
import { z } from "zod";
import { isProduction } from "@/lib/utils";
import {
  checkRateLimit,
  isUserBlocked,
  recordAbuseStrike,
} from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { chatMessages, chatSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  createVerificationToken,
  getMessageCount,
  isSiteOwner,
} from "@/lib/auth";
import { FREE_MESSAGE_LIMIT } from "@/lib/constants";
import { sendMagicLinkEmail } from "@/lib/email";
import {
  getDefaultPromptParams,
  getIdentityContext,
  getPromptWithParams,
} from "@/lib/prompts";
import { createHash } from "crypto";
import type { Page, Painting } from "content-collections";

// Helper type for posts with _id
type PostsWithId = ContentWithId<Posts>;
type PaintingsWithId = ContentWithId<Painting[]>;
type PagesWithId = ContentWithId<Page[]>;
type ConciergeContent =
  PostsWithId[number] | PaintingsWithId[number] | PagesWithId[number];

interface ConciergeCopy {
  summaryLabel: string;
  auth: {
    accessDenied: string;
    rateLimited: string;
    magicLinkSent: (email: string) => string;
    magicLinkFailed: string;
    emailRequired: (limit: number) => string;
    invalidEmail: string;
    tooManyLinks: string;
    linkRequested: string;
    linkRequestFailed: string;
  };
  fallback: {
    toolLabel: string;
    resultLabel: string;
    toolResultsIntro: string;
    emptyResponse: string;
    chatFailed: string;
    answerFailed: string;
    answerInstruction: string;
    summaryPrompt: (conversation: string) => string;
    followUpInstruction: string;
    gatheredResults: (results: string) => string;
    followUpRequest: (message: string) => string;
  };
  tools: {
    noRelevantContent: string;
    noAuthorContent: string;
    noDescription: string;
    unknownAuthor: string;
    by: string;
    result: (index: number) => string;
    postCount: (count: number) => string;
    homepage: string;
    related: (url: string, content: string) => string;
    page: (url: string) => string;
    currentPage: string;
    description: string;
    type: string;
    author: string;
    year: string;
    tags: string;
    content: string;
    lookupError: (url: string) => string;
  };
}

const CONCIERGE_COPY = {
  [Locale.EN]: {
    summaryLabel: "Previous conversation summary",
    auth: {
      accessDenied: "Access to the chat is restricted for this session.",
      rateLimited: "Too many requests. Please try again later.",
      magicLinkSent: (email: string) =>
        `I sent a verification link to ${email}. Check your inbox and open the link to continue the conversation.`,
      magicLinkFailed:
        "I couldn’t send the verification email. Please try again or contact support.",
      emailRequired: (limit: number) =>
        `You’ve used all ${limit} free messages. To continue, enter your email address and I’ll send you a secure verification link.\n\nType only your email address in the chat.`,
      invalidEmail: "Please provide a valid email address.",
      tooManyLinks:
        "Too many links have been requested. Please wait a few minutes before trying again.",
      linkRequested:
        "Verification link sent. Check your inbox and open it to continue the conversation.",
      linkRequestFailed:
        "The verification email could not be sent. Please try again.",
    },
    fallback: {
      toolLabel: "Tool",
      resultLabel: "Result",
      toolResultsIntro: "Based on the information I found:",
      emptyResponse:
        "I couldn’t prepare a complete response. Could you rephrase your question?",
      chatFailed: "The response could not be generated. Please try again.",
      answerFailed: "The answer could not be generated. Please try again.",
      answerInstruction:
        "You are the site's literary concierge. Use the appropriate catalog or archive tool before answering, then provide a concise and conversational response.",
      summaryPrompt: (conversation: string) =>
        `Summarize this conversation concisely while preserving key information:\n\n${conversation}`,
      followUpInstruction:
        "Provide a conversational response based on the tool results. Never leave the response empty.",
      gatheredResults: (results: string) =>
        `I gathered the following information with the archive tools:\n\n${results}\n\nI will now give the visitor a useful response.`,
      followUpRequest: (message: string) =>
        `Answer the visitor's question using the gathered information. Be specific and conversational. Their question was: "${message}"`,
    },
    tools: {
      noRelevantContent: "No relevant content found.",
      noAuthorContent: "No matching content by Abdul Hamid was found.",
      noDescription: "No description",
      unknownAuthor: "Unknown artist",
      by: "by",
      result: (index: number) => `Result ${index}`,
      postCount: (count: number) => `${count} posts`,
      homepage: "The visitor is on the homepage.",
      related: (url: string, content: string) =>
        `The visitor is viewing ${url}. Related archive content: ${content}`,
      page: (url: string) => `The visitor is viewing the page at ${url}.`,
      currentPage: "Current page",
      description: "Description",
      type: "Type",
      author: "Author",
      year: "Year",
      tags: "Tags",
      content: "Content",
      lookupError: (url: string) =>
        `The page content for ${url} could not be retrieved.`,
    },
  },
  [Locale.ES]: {
    summaryLabel: "Resumen de la conversación anterior",
    auth: {
      accessDenied: "El acceso al chat está restringido para esta sesión.",
      rateLimited: "Hay demasiadas solicitudes. Inténtalo de nuevo más tarde.",
      magicLinkSent: (email: string) =>
        `Te envié un enlace de verificación a ${email}. Revisa tu correo y ábrelo para continuar la conversación.`,
      magicLinkFailed:
        "No pude enviar el correo de verificación. Inténtalo de nuevo o ponte en contacto con soporte.",
      emailRequired: (limit: number) =>
        `Ya utilizaste tus ${limit} mensajes gratuitos. Para continuar, escribe tu correo electrónico y te enviaré un enlace seguro de verificación.\n\nEscribe únicamente tu dirección de correo en el chat.`,
      invalidEmail: "Escribe una dirección de correo válida.",
      tooManyLinks:
        "Has solicitado demasiados enlaces. Espera unos minutos antes de intentarlo de nuevo.",
      linkRequested:
        "Enlace de verificación enviado. Revisa tu correo y ábrelo para continuar la conversación.",
      linkRequestFailed:
        "No se pudo enviar el correo de verificación. Inténtalo de nuevo.",
    },
    fallback: {
      toolLabel: "Herramienta",
      resultLabel: "Resultado",
      toolResultsIntro: "Con la información que encontré:",
      emptyResponse:
        "No pude preparar una respuesta completa. ¿Podrías reformular tu pregunta?",
      chatFailed: "No se pudo generar la respuesta. Inténtalo de nuevo.",
      answerFailed: "No se pudo generar la respuesta. Inténtalo de nuevo.",
      answerInstruction:
        "Eres el conserje literario del sitio. Usa la herramienta adecuada del catálogo o del archivo antes de responder y ofrece una respuesta breve y conversacional.",
      summaryPrompt: (conversation: string) =>
        `Resume esta conversación de forma concisa y conserva la información clave:\n\n${conversation}`,
      followUpInstruction:
        "Redacta una respuesta conversacional a partir de los resultados de las herramientas. Nunca dejes la respuesta vacía.",
      gatheredResults: (results: string) =>
        `He reunido la siguiente información con las herramientas del archivo:\n\n${results}\n\nAhora daré una respuesta útil a la persona visitante.`,
      followUpRequest: (message: string) =>
        `Responde la pregunta de la persona visitante con la información reunida. Sé específico y conversacional. Su pregunta fue: «${message}»`,
    },
    tools: {
      noRelevantContent: "No se encontró contenido relevante.",
      noAuthorContent: "No se encontró contenido de Abdul Hamid que coincida.",
      noDescription: "Sin descripción",
      unknownAuthor: "Artista desconocido",
      by: "de",
      result: (index: number) => `Resultado ${index}`,
      postCount: (count: number) => `${count} publicaciones`,
      homepage: "La persona visitante está en la página de inicio.",
      related: (url: string, content: string) =>
        `La persona visitante está viendo ${url}. Contenido relacionado del archivo: ${content}`,
      page: (url: string) =>
        `La persona visitante está viendo la página ${url}.`,
      currentPage: "Página actual",
      description: "Descripción",
      type: "Tipo",
      author: "Autoría",
      year: "Año",
      tags: "Etiquetas",
      content: "Contenido",
      lookupError: (url: string) =>
        `No se pudo recuperar el contenido de la página ${url}.`,
    },
  },
  [Locale.RU]: {
    summaryLabel: "Краткое содержание предыдущего разговора",
    auth: {
      accessDenied: "Доступ к чату ограничен для этой сессии.",
      rateLimited: "Слишком много запросов. Повторите попытку позже.",
      magicLinkSent: (email: string) =>
        `Я отправил ссылку для подтверждения на ${email}. Проверьте почту и перейдите по ссылке, чтобы продолжить разговор.`,
      magicLinkFailed:
        "Не удалось отправить письмо для подтверждения. Повторите попытку или обратитесь в поддержку.",
      emailRequired: (limit: number) =>
        `Вы использовали все ${limit} бесплатных сообщений. Чтобы продолжить, введите адрес электронной почты, и я отправлю безопасную ссылку для подтверждения.\n\nВведите в чат только адрес электронной почты.`,
      invalidEmail: "Введите корректный адрес электронной почты.",
      tooManyLinks:
        "Запрошено слишком много ссылок. Подождите несколько минут и повторите попытку.",
      linkRequested:
        "Ссылка для подтверждения отправлена. Проверьте почту и перейдите по ней, чтобы продолжить разговор.",
      linkRequestFailed:
        "Не удалось отправить письмо для подтверждения. Повторите попытку.",
    },
    fallback: {
      toolLabel: "Инструмент",
      resultLabel: "Результат",
      toolResultsIntro: "На основе найденной информации:",
      emptyResponse:
        "Не удалось подготовить полный ответ. Попробуйте переформулировать вопрос.",
      chatFailed: "Не удалось сформировать ответ. Повторите попытку.",
      answerFailed: "Не удалось сформировать ответ. Повторите попытку.",
      answerInstruction:
        "Вы — литературный консьерж сайта. Перед ответом используйте подходящий инструмент каталога или архива, а затем дайте краткий разговорный ответ.",
      summaryPrompt: (conversation: string) =>
        `Кратко подведите итог разговора, сохранив ключевую информацию:\n\n${conversation}`,
      followUpInstruction:
        "Сформулируйте разговорный ответ на основе результатов инструментов. Никогда не оставляйте ответ пустым.",
      gatheredResults: (results: string) =>
        `Я собрал следующую информацию с помощью инструментов архива:\n\n${results}\n\nТеперь я дам посетителю полезный ответ.`,
      followUpRequest: (message: string) =>
        `Ответьте на вопрос посетителя, используя собранную информацию. Будьте конкретны и сохраняйте разговорный тон. Вопрос: «${message}»`,
    },
    tools: {
      noRelevantContent: "Подходящие материалы не найдены.",
      noAuthorContent: "Подходящие материалы Абдула Хамида не найдены.",
      noDescription: "Без описания",
      unknownAuthor: "Неизвестный автор",
      by: "—",
      result: (index: number) => `Результат ${index}`,
      postCount: (count: number) => `${count} публикаций`,
      homepage: "Посетитель находится на главной странице.",
      related: (url: string, content: string) =>
        `Посетитель просматривает ${url}. Связанный материал архива: ${content}`,
      page: (url: string) => `Посетитель просматривает страницу ${url}.`,
      currentPage: "Текущая страница",
      description: "Описание",
      type: "Тип",
      author: "Автор",
      year: "Год",
      tags: "Теги",
      content: "Содержание",
      lookupError: (url: string) =>
        `Не удалось получить содержимое страницы ${url}.`,
    },
  },
} satisfies Record<Locale, ConciergeCopy>;

// Helper function to hash email for rate limiting (prevents PII leakage)
function hashEmail(email: string): string {
  return createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

function resolveLocale(locale: string | null | undefined): Locale {
  return (
    Object.values(Locale).find(
      (supportedLocale) => supportedLocale === locale,
    ) ?? Locale.EN
  );
}

function getClientIp(context: Context): string {
  return (
    context.req.headers.get("x-real-ip") ??
    context.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1"
  );
}

function staticChatOutput(message: string) {
  return {
    message,
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    },
  };
}

function getLocaleInstruction(locale: Locale) {
  if (locale === Locale.ES) {
    return "El idioma de esta solicitud es español. Escribe toda la respuesta en español; no cambies de idioma salvo que la persona pida explícitamente una traducción.";
  }

  if (locale === Locale.RU) {
    return "Язык этого запроса — русский. Пишите весь ответ по-русски и не меняйте язык, если пользователь прямо не попросит о переводе.";
  }

  return "The request language is English. Write the entire response in English; do not switch languages unless the visitor explicitly asks for a translation.";
}

function getSectionPath(section: "posts" | "paintings", slug: string) {
  const normalizedSlug = slug.replace(/^\/+/, "");
  const slugWithoutSection = normalizedSlug.startsWith(`${section}/`)
    ? normalizedSlug.slice(section.length + 1)
    : normalizedSlug;

  return `/${section}/${slugWithoutSection}`;
}

function navigationToken(locale: Locale, pathname: string) {
  return `[NAVIGATE:${getLocalizedPath(locale, pathname)}]`;
}

function isToolResult(
  value: unknown,
): value is { toolName: string; output: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    "toolName" in value &&
    typeof value.toolName === "string" &&
    "output" in value
  );
}

// Define tools for the AI assistant
const createTools = (locale: Locale) => ({
  searchContent: tool({
    description:
      "Search the blog content for relevant information about posts, paintings, and pages. Use this tool to find specific information before answering questions.",
    inputSchema: z.object({
      query: z.string().describe("The search query to find relevant content"),
      limit: z
        .number()
        .optional()
        .default(5)
        .describe("Maximum number of results to return"),
    }),
    execute: async ({ query, limit }) => {
      const copy = CONCIERGE_COPY[locale].tools;
      const results = await searchSimilarContent(query, locale, limit);
      if (results.length === 0) {
        return copy.noRelevantContent;
      }
      return results
        .map(
          (result, index) =>
            `[${copy.result(index + 1)}]\n${result.content}\n---`,
        )
        .join("\n\n");
    },
  }),

  searchProjects: tool({
    description:
      "Search Abdul Hamid's real project catalog. You MUST use this before answering any question about a named project, product, tool, CLI, library, live deployment, or something Abdul Hamid built. Never infer a project from the ordinary meaning of its name.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "The user's project question or the exact project, product, tool, or domain name",
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .default(5)
        .describe("Maximum number of catalog matches to return"),
    }),
    execute: ({ query, limit }) =>
      formatProjectSearchResults(findProjects(query, locale, limit), locale),
  }),

  listCurrentProjects: tool({
    description:
      "Return Abdul Hamid's authoritative current-work sequence. You MUST use this when a visitor asks what he is building, working on, developing, or shipping now, including paraphrases in English, Spanish, or Russian.",
    inputSchema: z.object({
      limit: z.number().int().min(1).max(10).optional().default(5),
    }),
    execute: ({ limit }) =>
      formatProjectSearchResults(getCurrentProjects(locale, limit), locale),
  }),

  navigateToPost: tool({
    description:
      "Provide a clickable navigation link to a specific blog post. Use when user wants to read a post.",
    inputSchema: z.object({
      slug: z.string().describe("The post slug/URL path"),
    }),
    execute: ({ slug }) => {
      return navigationToken(locale, getSectionPath("posts", slug));
    },
  }),

  navigateToPainting: tool({
    description:
      "Provide a clickable navigation link to a specific painting. Use when user wants to view a painting.",
    inputSchema: z.object({
      slug: z.string().describe("The painting slug/URL path"),
    }),
    execute: ({ slug }) => {
      return navigationToken(locale, getSectionPath("paintings", slug));
    },
  }),

  navigateToTag: tool({
    description:
      "Provide a clickable navigation link to view all content with a specific tag.",
    inputSchema: z.object({
      tag: z.string().describe("The tag name"),
    }),
    execute: ({ tag }) => {
      return navigationToken(locale, `/tags/${encodeURIComponent(tag)}`);
    },
  }),

  listRecentPosts: tool({
    description: "Get a list of recent blog posts with titles and summaries.",
    inputSchema: z.object({
      limit: z
        .number()
        .optional()
        .default(5)
        .describe("Number of posts to return"),
    }),
    execute: ({ limit }) => {
      const copy = CONCIERGE_COPY[locale].tools;
      const posts = getContent([], ContentType.POST, locale) as PostsWithId;
      const recentPosts = posts.slice(0, limit);
      return recentPosts
        .map(
          (post) =>
            `- **${post.title}** ${navigationToken(locale, post.slug)}\n  ${post.description || copy.noDescription}`,
        )
        .join("\n\n");
    },
  }),

  listPaintings: tool({
    description: "Get a list of paintings in the gallery.",
    inputSchema: z.object({
      limit: z
        .number()
        .optional()
        .default(5)
        .describe("Number of paintings to return"),
    }),
    execute: ({ limit }) => {
      const copy = CONCIERGE_COPY[locale].tools;
      const paintings = getContent(
        [],
        ContentType.PAINTING,
        locale,
      ) as PaintingsWithId;
      const recentPaintings = paintings.slice(0, limit);
      return recentPaintings
        .map(
          (painting) =>
            `- **${painting.title}** ${copy.by} ${painting.author || copy.unknownAuthor} ${navigationToken(locale, painting.slug)}\n  ${painting.description || copy.noDescription}`,
        )
        .join("\n\n");
    },
  }),

  listPopularTags: tool({
    description: "Get a list of popular/available tags in the blog.",
    inputSchema: z.object({}),
    execute: () => {
      const copy = CONCIERGE_COPY[locale].tools;
      const posts = getContent([], ContentType.POST, locale) as PostsWithId;
      const tagCounts = posts.reduce<Record<string, number>>((acc, post) => {
        post.tags?.forEach((tag: string) => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {});

      return Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(
          ([tag, count]) =>
            `- ${tag} (${copy.postCount(count)}) ${navigationToken(locale, `/tags/${encodeURIComponent(tag)}`)}`,
        )
        .join("\n");
    },
  }),

  searchAuthorContent: tool({
    description:
      "Search for content by Abdul Hamid, the blog author. Use this to find his posts, thoughts, and writings.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("Search query related to Abdul Hamid or his content"),
    }),
    execute: async ({ query }) => {
      const copy = CONCIERGE_COPY[locale].tools;
      const results = await searchSimilarContent(
        `Abdul Hamid ${query}`,
        locale,
        5,
      );
      if (results.length === 0) {
        return copy.noAuthorContent;
      }
      return results
        .map(
          (result, index) =>
            `[${copy.result(index + 1)}]\n${result.content}\n---`,
        )
        .join("\n\n");
    },
  }),

  ...(isProduction
    ? {}
    : {
        debugContent: tool({
          description:
            "Debug tool to see what content is available. Use this to troubleshoot content detection issues.",
          inputSchema: z.object({
            type: z
              .string()
              .optional()
              .describe("Content type to debug: posts, paintings, or pages"),
          }),
          execute: ({ type }) => {
            if (type === "paintings") {
              const paintings = getContent(
                [],
                ContentType.PAINTING,
                locale,
              ) as PaintingsWithId;
              return `Available paintings (${paintings.length}):\n${paintings
                .slice(0, 5)
                .map(
                  (painting, index) =>
                    `${index + 1}. ${painting.title} - slugAsParams: "${painting.slugAsParams}", slug: "${painting.slug}"`,
                )
                .join("\n")}`;
            } else if (type === "posts") {
              const posts = getContent(
                [],
                ContentType.POST,
                locale,
              ) as PostsWithId;
              return `Available posts (${posts.length}):\n${posts
                .slice(0, 5)
                .map(
                  (post, index) =>
                    `${index + 1}. ${post.title} - slugAsParams: "${post.slugAsParams}", slug: "${post.slug}"`,
                )
                .join("\n")}`;
            } else {
              const allContent = getContent([], undefined, locale);
              return `All content (${allContent.length}):\n${allContent
                .slice(0, 10)
                .map(
                  (content, index) =>
                    `${index + 1}. ${content.title} (${content.type}) - slugAsParams: "${content.slugAsParams}", slug: "${content.slug}"`,
                )
                .join("\n")}`;
            }
          },
        }),
      }),

  getCurrentPageContent: tool({
    description:
      'Get detailed information about the page the user is currently viewing. Use this when the user asks about "this post", "this painting", or "the current page". CRITICAL: You must use the exact currentPageUrl provided in the instructions (e.g., "/posts/city-a-poem-from-vladimir-kotlyarov"), NOT generic URLs like "/current-page".',
    inputSchema: z.object({
      url: z
        .string()
        .describe(
          'The current page URL path - MUST be the exact currentPageUrl from the instructions (e.g., "/posts/city-a-poem-from-vladimir-kotlyarov")',
        ),
    }),
    execute: async ({ url }) => {
      const copy = CONCIERGE_COPY[locale].tools;
      try {
        // Parse URL to extract content type and slug
        // URLs can be like: /posts/slug, /paintings/slug, /about, or with a locale prefix.
        let urlParts = url.split("/").filter((p) => p);

        if (urlParts.length === 0) {
          return copy.homepage;
        }

        if (
          Object.values(Locale).some(
            (supportedLocale) => supportedLocale === urlParts[0],
          )
        ) {
          urlParts = urlParts.slice(1);
        }

        const contentType = urlParts[0]; // 'posts', 'paintings', or page name
        const slug = urlParts.slice(1).join("/"); // rest of the path

        // The full slug including content type (e.g., "posts/my-post")
        const fullSlug = urlParts.join("/");

        let content: ConciergeContent | undefined;

        if (contentType === "posts" && slug) {
          const posts = getContent([], ContentType.POST, locale) as PostsWithId;

          // Try both with and without the content type prefix
          content = posts.find(
            (post) =>
              post.slugAsParams === slug ||
              post.slugAsParams === fullSlug ||
              post.slug === `/${slug}` ||
              post.slug === `/${fullSlug}`,
          );

          // Fallback: try partial matching if exact match fails
          if (!content) {
            content = posts.find(
              (post) =>
                post.slugAsParams.includes(slug) ||
                post.slug.includes(slug) ||
                post.title.toLowerCase().includes(slug.toLowerCase()),
            );
          }
        } else if (contentType === "paintings" && slug) {
          const paintings = getContent(
            [],
            ContentType.PAINTING,
            locale,
          ) as PaintingsWithId;
          content = paintings.find(
            (painting) =>
              painting.slugAsParams === slug ||
              painting.slugAsParams === fullSlug ||
              painting.slug === `/${slug}` ||
              painting.slug === `/${fullSlug}`,
          );

          // Fallback: try partial matching if exact match fails
          if (!content) {
            content = paintings.find(
              (painting) =>
                painting.slugAsParams.includes(slug) ||
                painting.slug.includes(slug) ||
                painting.title.toLowerCase().includes(slug.toLowerCase()),
            );
          }
        } else {
          const pages = getContent([], ContentType.PAGE, locale) as PagesWithId;
          content = pages.find(
            (page) =>
              page.slugAsParams === contentType ||
              page.slug === `/${contentType}`,
          );
        }

        if (!content) {
          // Last resort: try to find content using search
          try {
            const searchResults = await searchSimilarContent(
              slug || contentType,
              locale,
              1,
            );
            if (searchResults.length > 0) {
              const foundContent = searchResults[0];
              return copy.related(
                url,
                `${foundContent.content.substring(0, 200)}…`,
              );
            }
          } catch (error) {
            console.error("Error in fallback search:", error);
          }

          // Even if we can't find specific content, return basic page info
          return copy.page(url);
        }

        const author = "author" in content ? content.author : null;
        const year = "year" in content ? content.year : null;

        const info = [
          `**${copy.currentPage}: ${content.title}**`,
          content.description
            ? `${copy.description}: ${content.description}`
            : "",
          content.type ? `${copy.type}: ${content.type}` : "",
          author ? `${copy.author}: ${author}` : "",
          year ? `${copy.year}: ${year}` : "",
          content.tags ? `${copy.tags}: ${content.tags.join(", ")}` : "",
          content.content
            ? `\n${copy.content}:\n${content.content.substring(0, 1000)}…`
            : "",
        ]
          .filter(Boolean)
          .join("\n");

        return info;
      } catch (error) {
        console.error("Error in getCurrentPageContent tool:", error);
        return copy.lookupError(url);
      }
    },
  }),
});

// Ensure chat session exists in database
async function ensureChatSession(
  sessionId: string,
  userId: string | null = null,
) {
  try {
    // Check if session exists
    const existing = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.sessionId, sessionId))
      .limit(1);

    if (existing.length === 0) {
      // Create new session
      await db.insert(chatSessions).values({
        sessionId,
        userId,
      });
    }
  } catch {
    // Persistence is optional; chat remains available if the table is unavailable.
  }
}

// Save chat message to database (optional - tables may not exist yet)
async function saveChatMessage(
  sessionId: string,
  role: string,
  content: string,
  tokens?: number,
) {
  try {
    await db.insert(chatMessages).values({
      sessionId,
      role,
      content,
      tokens: tokens || null,
    });
  } catch {
    // Persistence is optional; chat remains available if the table is unavailable.
  }
}

// Summarize conversation when it gets too long (optional - requires DB tables)
async function summarizeConversation(sessionId: string, locale: Locale) {
  try {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(10);

    if (messages.length < 10) return;

    const conversationText = messages
      .reverse()
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const { text: summary } = await generateText({
      model: conciergeModel,
      instructions: getLocaleInstruction(locale),
      prompt: CONCIERGE_COPY[locale].fallback.summaryPrompt(conversationText),
      providerOptions: getConciergeProviderOptions({
        feature: "conversation-summary",
        user: `session-${sessionId}`,
        locale,
      }),
    });

    // Delete old messages
    await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));

    // Insert summary as system message
    await saveChatMessage(
      sessionId,
      "system",
      `${CONCIERGE_COPY[locale].summaryLabel}: ${summary}`,
    );
  } catch {
    // Summarization is optional; retain the original messages if it fails.
  }
}

function groupByMonth(posts: PostsWithId) {
  return groupBy(posts, (post) => {
    const date = new Date(post.date || "");
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  });
}

function categorizeReadingTime(posts: PostsWithId) {
  return countBy(posts, (post) => {
    const time = post.readingTime.minutes;
    if (time < 2) return "0-2 minutes";
    if (time < 5) return "2-5 minutes";
    if (time < 10) return "5-10 minutes";
    return "10+ minutes";
  });
}

// Input validation schema for GraphQL chat mutation (mirrors streaming endpoint)
const chatInputSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().uuid(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      }),
    )
    .max(50)
    .default([]),
  currentPageUrl: z.string().max(500).optional(),
});

const resolvers: Resolvers = {
  Mutation: {
    async chat(root, { input }, context: Context) {
      // Validate input to prevent cost-escalation attacks
      const validated = chatInputSchema.safeParse(input);
      if (!validated.success) {
        throw new Error(
          "Invalid input: " +
            validated.error.issues.map((i) => i.message).join(", "),
        );
      }
      const {
        message,
        sessionId,
        history = [],
        currentPageUrl,
      } = validated.data;
      const userLocale = resolveLocale(context.locale);
      const copy = CONCIERGE_COPY[userLocale];
      const user = context.user;
      const moderation = moderateInput(message);

      if (moderation.result === ModerationResult.SUPPORT) {
        return staticChatOutput(getCrisisSupportMessage(userLocale));
      }

      if (moderation.result === ModerationResult.BLOCK) {
        await recordAbuseStrike(getClientIp(context));
        return staticChatOutput(getModerationBlockMessage(userLocale));
      }

      // Check if user is authenticated
      if (user.isAuthenticated) {
        // Authenticated users can chat freely
        const userId = user.id;

        // Check if user is blocked
        if (await isUserBlocked(userId)) {
          throw new Error(copy.auth.accessDenied);
        }

        // Check rate limits
        const rateLimitResult = await checkRateLimit(userId);
        if (!rateLimitResult.allowed) {
          throw new Error(copy.auth.rateLimited);
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
              await sendMagicLinkEmail(message.trim(), token, userLocale);

              return {
                message: copy.auth.magicLinkSent(message.trim()),
                usage: {
                  promptTokens: 0,
                  completionTokens: 0,
                  totalTokens: 0,
                },
              };
            } catch (error) {
              console.error("Error sending magic link:", error);
              return {
                message: copy.auth.magicLinkFailed,
                usage: {
                  promptTokens: 0,
                  completionTokens: 0,
                  totalTokens: 0,
                },
              };
            }
          } else {
            // User hasn't provided email yet, show auth prompt
            return {
              message: copy.auth.emailRequired(FREE_MESSAGE_LIMIT),
              usage: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
              },
            };
          }
        }

        // User has messages remaining, use temporary ID for rate limiting
        const tempUserId = `session-${sessionId}`;

        // Check if user is blocked
        if (await isUserBlocked(tempUserId)) {
          throw new Error(copy.auth.accessDenied);
        }

        // Check rate limits
        const rateLimitResult = await checkRateLimit(tempUserId);
        if (!rateLimitResult.allowed) {
          throw new Error(copy.auth.rateLimited);
        }
      }

      // Create locale-aware tools
      const tools = createTools(userLocale);

      // Load personality prompt dynamically
      const defaultParams = getDefaultPromptParams(userLocale);
      const personalityPrompt = getPromptWithParams(
        "smerdyakov-personality",
        userLocale,
        defaultParams,
      );
      const toolInstructions = getPromptWithParams(
        "tool-instructions",
        userLocale,
        {
          ...defaultParams,
          currentPageUrl: currentPageUrl ?? getLocalizedPath(userLocale, "/"),
        },
      );
      const localeInstruction = getLocaleInstruction(userLocale);

      if (!personalityPrompt) {
        console.warn(
          "Concierge personality prompt is empty; using the locale instruction fallback.",
        );
      }

      // Add current page context if available
      let finalInstructions = [
        personalityPrompt,
        toolInstructions,
        getIdentityContext(userLocale, isSiteOwner(user)),
        localeInstruction,
      ]
        .filter(Boolean)
        .join("\n\n");
      if (isCurrentProjectQuery(message)) {
        finalInstructions += `\n\nAUTHORITATIVE CURRENT PROJECT CONTEXT:\n${formatCurrentProjectContext(userLocale)}\nUse this exact curated sequence when answering the current-work question.`;
      }
      if (currentPageUrl) {
        const pageContextPrompt = getPromptWithParams(
          "page-context",
          userLocale,
          {
            ...defaultParams,
            currentPageUrl,
          },
        );
        if (pageContextPrompt) {
          finalInstructions += `\n\n${pageContextPrompt}`;
        } else {
          // Fallback if page-context prompt not found
          console.warn(
            "Page context prompt not found; using the inline fallback.",
          );
          finalInstructions += `\n\nIMPORTANT: The user is currently viewing this page: ${currentPageUrl}.

When the user asks about "this page", "this post", "this article", or anything about what they're currently reading, you MUST call the getCurrentPageContent tool with the EXACT URL "${currentPageUrl}" (not /current-page or any other URL).

Example: If user asks "what's this about?" or "tell me about this post", call getCurrentPageContent with url: "${currentPageUrl}"

This is critical for providing relevant context about what they're actually viewing.`;
        }
      }

      // Build conversation history
      const messages: ModelMessage[] = [
        ...history.map(({ role, content }) => ({ role, content })),
        { role: "user", content: message },
      ];

      try {
        // Determine user ID for session
        const userId = user.isAuthenticated ? user.id : `session-${sessionId}`;

        // Ensure session exists in database before saving messages
        await ensureChatSession(sessionId, userId);

        const result = await generateText({
          model: conciergeModel,
          instructions: finalInstructions,
          messages,
          tools,
          stopWhen: isStepCount(3),
          providerOptions: getConciergeProviderOptions({
            feature: "concierge-graphql-chat",
            user: userId,
            locale: userLocale,
          }),
        });

        // Get the full response text
        let fullResponse = result.text;

        // Safety check: if response is empty but we have tool results, make a follow-up call
        if (!fullResponse || fullResponse.trim().length === 0) {
          // If we have tool results, try a follow-up generation with the results
          if (result.toolResults && result.toolResults.length > 0) {
            const toolResultsText = result.toolResults
              .flatMap((toolResult) =>
                isToolResult(toolResult)
                  ? [
                      `${copy.fallback.toolLabel}: ${toolResult.toolName}\n${copy.fallback.resultLabel}: ${String(toolResult.output)}`,
                    ]
                  : [],
              )
              .join("\n\n");

            // Make a follow-up call without tools to force text generation
            try {
              const followUpResult = await generateText({
                model: conciergeModel,
                instructions: `${finalInstructions}\n\n${copy.fallback.followUpInstruction}`,
                messages: [
                  ...messages,
                  {
                    role: "assistant",
                    content: copy.fallback.gatheredResults(toolResultsText),
                  },
                  {
                    role: "user",
                    content: copy.fallback.followUpRequest(message),
                  },
                ],
                providerOptions: getConciergeProviderOptions({
                  feature: "concierge-graphql-follow-up",
                  user: userId,
                  locale: userLocale,
                }),
              });

              fullResponse = followUpResult.text;
            } catch (error) {
              console.error("Follow-up generation failed:", error);
              fullResponse = `${copy.fallback.toolResultsIntro}\n\n${toolResultsText}`;
            }
          }

          // Last resort: provide a generic error message
          if (!fullResponse || fullResponse.trim().length === 0) {
            fullResponse = copy.fallback.emptyResponse;
          }
        }

        // Get usage info
        const usage = result.usage;

        // Save to database
        const promptTokens = usage.inputTokens ?? 0;
        const completionTokens = usage.outputTokens ?? 0;

        await saveChatMessage(sessionId, "user", message, promptTokens);
        await saveChatMessage(
          sessionId,
          "assistant",
          fullResponse,
          completionTokens,
        );

        // Summarize if history > 10 messages
        if (history.length > 10) {
          await summarizeConversation(sessionId, userLocale);
        }

        return {
          message: fullResponse,
          usage: {
            promptTokens,
            completionTokens,
            totalTokens: usage.totalTokens || 0,
          },
        };
      } catch (error) {
        console.error("Error in chat mutation:", error);
        throw new Error(copy.fallback.chatFailed);
      }
    },

    async requestMagicLink(root, { email }, context: Context) {
      const copy = CONCIERGE_COPY[resolveLocale(context.locale)];

      try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return {
            success: false,
            message: copy.auth.invalidEmail,
          };
        }

        // Rate limit magic link requests by email to prevent email bombing
        // Hash the email to prevent PII leakage in rate limit datastore/logs
        const rateLimitResult = await checkRateLimit(
          `magic-link:${hashEmail(email)}`,
          "chat",
        );
        if (!rateLimitResult.allowed) {
          return {
            success: false,
            message: copy.auth.tooManyLinks,
          };
        }

        // Create verification token
        const token = await createVerificationToken(email);

        // Send magic link email
        await sendMagicLinkEmail(email, token, context.locale);

        return {
          success: true,
          message: copy.auth.linkRequested,
        };
      } catch (error) {
        console.error("Error in requestMagicLink:", error);
        return {
          success: false,
          message: copy.auth.linkRequestFailed,
        };
      }
    },
  },
  Query: {
    posts(root, args, context) {
      return getContent([], ContentType.POST, resolveLocale(context.locale));
    },

    paintings(root, args, context: Context) {
      return getContent(
        [],
        ContentType.PAINTING,
        resolveLocale(context.locale),
      );
    },

    pages(root, args, context: Context) {
      return getContent([], ContentType.PAGE, resolveLocale(context.locale));
    },

    content(root, args, context: Context) {
      return getContent([], undefined, resolveLocale(context.locale));
    },

    postsOverTime(root, args, context: Context) {
      const posts = getContent(
        [],
        ContentType.POST,
        resolveLocale(context.locale),
      ) as PostsWithId;
      const groupedPosts = groupByMonth(posts);
      const items = map(groupedPosts, (posts, month) => ({
        month,
        count: posts.length,
      }));
      // Sort by YYYY-M or YYYY-MM lexical order
      return items.sort((a, b) => a.month.localeCompare(b.month));
    },

    readingTimeDistribution(root, args, context: Context) {
      const posts = getContent(
        [],
        ContentType.POST,
        resolveLocale(context.locale),
      ) as PostsWithId;
      const distribution = categorizeReadingTime(posts);
      const items = map(distribution, (count, category) => ({
        category,
        count,
      }));
      const order = [
        "0-2 minutes",
        "2-5 minutes",
        "5-10 minutes",
        "10+ minutes",
      ];
      return items.sort(
        (a, b) => order.indexOf(a.category) - order.indexOf(b.category),
      );
    },

    async search(root, { query, k = 5, locale }, context: Context) {
      const searchLocale = resolveLocale(locale || context.locale);
      const foundContent = await searchSimilarContent(query, searchLocale, k!);
      const ids = [
        ...new Set(foundContent.map((result) => result.id)),
      ] as string[];
      const results = getContent(ids, undefined, searchLocale);
      const count = results.length;
      return {
        results,
        count,
      };
    },

    async answer(root, { question, k = 5 }, context: Context) {
      const userLocale = resolveLocale(context.locale);
      const copy = CONCIERGE_COPY[userLocale];
      const moderation = moderateInput(question);

      if (moderation.result === ModerationResult.SUPPORT) {
        return {
          question,
          answer: getCrisisSupportMessage(userLocale),
          results: [],
          count: 0,
        };
      }

      if (moderation.result === ModerationResult.BLOCK) {
        await recordAbuseStrike(getClientIp(context));
        return {
          question,
          answer: getModerationBlockMessage(userLocale),
          results: [],
          count: 0,
        };
      }

      try {
        const tools = createTools(userLocale);
        const defaultParams = getDefaultPromptParams(userLocale);
        const personalityPrompt = getPromptWithParams(
          "smerdyakov-personality",
          userLocale,
          defaultParams,
        );
        const toolInstructions = getPromptWithParams(
          "tool-instructions",
          userLocale,
          {
            ...defaultParams,
            currentPageUrl: getLocalizedPath(userLocale, "/"),
          },
        );

        // Use the AI to answer the question with RAG
        const result = await generateText({
          model: conciergeModel,
          instructions: [
            personalityPrompt,
            toolInstructions,
            getIdentityContext(userLocale, isSiteOwner(context.user)),
            isCurrentProjectQuery(question)
              ? `AUTHORITATIVE CURRENT PROJECT CONTEXT:\n${formatCurrentProjectContext(userLocale)}\nUse this exact curated sequence when answering the current-work question.`
              : "",
            copy.fallback.answerInstruction,
            getLocaleInstruction(userLocale),
          ]
            .filter(Boolean)
            .join("\n\n"),
          messages: [{ role: "user", content: question }],
          tools,
          stopWhen: isStepCount(3),
          providerOptions: getConciergeProviderOptions({
            feature: "concierge-graphql-answer",
            user: context.user.isAuthenticated ? context.user.id : "anonymous",
            locale: userLocale,
          }),
        });

        // Get the answer
        const answer = result.text.trim() || copy.fallback.emptyResponse;

        // Get relevant content for display
        const foundContent = await searchSimilarContent(
          question,
          userLocale,
          k!,
        );
        const ids = [
          ...new Set(foundContent.map((result) => result.id)),
        ] as string[];
        const results = getContent(ids, undefined, userLocale);

        return {
          question,
          answer,
          results,
          count: results.length,
        };
      } catch (error) {
        console.error("Error in answer query:", error);
        throw new Error(copy.fallback.answerFailed);
      }
    },

    async topArtists() {
      return await lastfm.user
        .getTopArtists({ username: env.LASTFM_USERNAME })
        .then((response) =>
          response.artists.map((artist) => ({
            rank: artist.rank,
            name: artist.name,
            scrobbles: artist.scrobbles,
            url: artist.url,
          })),
        );
    },

    async topTracks() {
      return await lastfm.user
        .getTopTracks({ username: env.LASTFM_USERNAME })
        .then((response) =>
          response.tracks.map((track) => ({
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
          })),
        );
    },

    async topTags() {
      return await lastfm.user
        .getTopTags({ username: env.LASTFM_USERNAME })
        .then((response) => response.tags);
    },
  },

  Content: {
    __resolveType(obj) {
      if (
        obj?.type === ContentType.PAGE ||
        obj?.type === ContentType.POST ||
        obj?.type === ContentType.PAINTING
      ) {
        return obj.type;
      }
      return null;
    },
  },
};

export default resolvers;
