import { chatMessages, chatSessions } from "@/db/schema";
import {
  conciergeModel,
  getConciergeProviderOptions,
  searchSimilarContent,
} from "@/lib/ai";
import {
  getAuthenticatedUser,
  getMessageCount,
  isSiteOwner,
  type User,
} from "@/lib/auth";
import { FREE_MESSAGE_LIMIT } from "@/lib/constants";
import {
  getCrisisSupportMessage,
  getModerationBlockMessage,
} from "@/lib/chat-safety";
import { ContentType, getContent, Locale } from "@/lib/data";
import { db } from "@/lib/db";
import { sendConciergeMessageEmail } from "@/lib/concierge-email";
import { ModerationResult, moderateInput } from "@/lib/moderation";
import {
  findProjects,
  formatCurrentProjectContext,
  formatProjectSearchResults,
  getCurrentProjects,
  isCurrentProjectQuery,
} from "@/lib/project-search";
import {
  getDefaultPromptParams,
  getIdentityContext,
  getPromptWithParams,
} from "@/lib/prompts";
import {
  checkContactRateLimit,
  checkIpRateLimit,
  checkRateLimit,
  isIpBlocked,
  isUserBlocked,
  recordAbuseStrike,
} from "@/lib/rate-limit";
import { getLocalizedPath } from "@/lib/site-url";
import { isProduction } from "@/lib/utils";
import type { Page, Painting, Post } from "content-collections";
import { eq } from "drizzle-orm";
import { isStepCount, type ModelMessage, streamText, tool } from "ai";
import { type NextRequest } from "next/server";
import { z } from "zod";

// Allow up to 60s for streaming responses (Vercel Pro) or signal intent on Hobby.
// On Hobby, the three-step tool limit keeps generation within the shorter budget.
export const maxDuration = 60;

const ALLOWED_ORIGINS = [
  "https://www.abdulachik.dev",
  "https://abdulachik.dev",
  ...(isProduction ? [] : ["http://localhost:3000"]),
];

const VALID_LOCALES = new Set<string>(Object.values(Locale));
const TEXT_ENCODER = new TextEncoder();

const LANGUAGE_INSTRUCTIONS: Record<Locale, string> = {
  [Locale.EN]:
    "LANGUAGE REQUIREMENT: Always answer in English, even when source material or tool results use another language.",
  [Locale.ES]:
    "REQUISITO DE IDIOMA: Responde siempre en español, aunque las fuentes o los resultados de las herramientas estén en otro idioma.",
  [Locale.RU]:
    "ЯЗЫКОВОЕ ТРЕБОВАНИЕ: Всегда отвечай по-русски, даже если источники или результаты инструментов даны на другом языке.",
};

const STREAM_RESPONSE_COPY = {
  [Locale.EN]: {
    accessDenied: "Access denied",
    rateLimitExceeded: "Rate limit exceeded",
    authenticationRequired: "Authentication required",
    invalidInput: "Invalid input",
    internalError: "Internal server error",
    generationFailed: "Failed to generate response",
  },
  [Locale.ES]: {
    accessDenied: "Acceso denegado",
    rateLimitExceeded: "Se superó el límite de solicitudes",
    authenticationRequired: "Se requiere verificación",
    invalidInput: "Entrada no válida",
    internalError: "Error interno del servidor",
    generationFailed: "No se pudo generar la respuesta",
  },
  [Locale.RU]: {
    accessDenied: "Доступ запрещён",
    rateLimitExceeded: "Превышен лимит запросов",
    authenticationRequired: "Требуется подтверждение",
    invalidInput: "Некорректные входные данные",
    internalError: "Внутренняя ошибка сервера",
    generationFailed: "Не удалось сформировать ответ",
  },
} satisfies Record<
  Locale,
  {
    accessDenied: string;
    rateLimitExceeded: string;
    authenticationRequired: string;
    invalidInput: string;
    internalError: string;
    generationFailed: string;
  }
>;

const CONTACT_TOOL_COPY = {
  [Locale.EN]: {
    sent: "The message was sent to Abdul Hamid. Any reply will go to the visitor's verified email address.",
    rateLimited:
      "The daily contact limit has been reached. No email was sent; please try again after the limit resets.",
    unavailable:
      "The email could not be sent right now. No delivery should be claimed; please try again later.",
  },
  [Locale.ES]: {
    sent: "El mensaje se envió a Abdul Hamid. Cualquier respuesta llegará al correo verificado de la persona visitante.",
    rateLimited:
      "Se alcanzó el límite diario de contacto. No se envió ningún correo; inténtalo de nuevo cuando se restablezca el límite.",
    unavailable:
      "No se pudo enviar el correo en este momento. No confirmes la entrega; inténtalo de nuevo más tarde.",
  },
  [Locale.RU]: {
    sent: "Сообщение отправлено Абдулу Хамиду. Ответ придёт на подтверждённый адрес посетителя.",
    rateLimited:
      "Дневной лимит сообщений исчерпан. Письмо не отправлено; повторите попытку после сброса лимита.",
    unavailable:
      "Сейчас отправить письмо не удалось. Не подтверждайте доставку; попробуйте позже.",
  },
} satisfies Record<
  Locale,
  { sent: string; rateLimited: string; unavailable: string }
>;

const TOOL_COPY = {
  [Locale.EN]: {
    noRelevantContent: "No relevant content found.",
    noAuthorContent: "No matching content by Abdul Hamid was found.",
    noDescription: "No description",
    unknownAuthor: "Unknown artist",
    by: "by",
    result: (index: number) => `Result ${index}`,
    postCount: (count: number) => `${count} posts`,
    homepage: "The visitor is on the homepage.",
    currentPage: "Current page",
    description: "Description",
    type: "Type",
    author: "Author",
    year: "Year",
    tags: "Tags",
    content: "Content",
    related: (url: string, content: string) =>
      `The visitor is viewing ${url}. Related archive content: ${content}`,
    page: (url: string) => `The visitor is viewing the page at ${url}.`,
    lookupError: (url: string) =>
      `The page content for ${url} could not be retrieved.`,
  },
  [Locale.ES]: {
    noRelevantContent: "No se encontró contenido relevante.",
    noAuthorContent: "No se encontró contenido de Abdul Hamid que coincida.",
    noDescription: "Sin descripción",
    unknownAuthor: "Artista desconocido",
    by: "de",
    result: (index: number) => `Resultado ${index}`,
    postCount: (count: number) => `${count} publicaciones`,
    homepage: "La persona visitante está en la página de inicio.",
    currentPage: "Página actual",
    description: "Descripción",
    type: "Tipo",
    author: "Autoría",
    year: "Año",
    tags: "Etiquetas",
    content: "Contenido",
    related: (url: string, content: string) =>
      `La persona visitante está viendo ${url}. Contenido relacionado del archivo: ${content}`,
    page: (url: string) => `La persona visitante está viendo la página ${url}.`,
    lookupError: (url: string) =>
      `No se pudo recuperar el contenido de la página ${url}.`,
  },
  [Locale.RU]: {
    noRelevantContent: "Подходящие материалы не найдены.",
    noAuthorContent: "Подходящие материалы Абдула Хамида не найдены.",
    noDescription: "Без описания",
    unknownAuthor: "Неизвестный автор",
    by: "—",
    result: (index: number) => `Результат ${index}`,
    postCount: (count: number) => `${count} публикаций`,
    homepage: "Посетитель находится на главной странице.",
    currentPage: "Текущая страница",
    description: "Описание",
    type: "Тип",
    author: "Автор",
    year: "Год",
    tags: "Теги",
    content: "Содержание",
    related: (url: string, content: string) =>
      `Посетитель просматривает ${url}. Связанный материал архива: ${content}`,
    page: (url: string) => `Посетитель просматривает страницу ${url}.`,
    lookupError: (url: string) =>
      `Не удалось получить содержимое страницы ${url}.`,
  },
} satisfies Record<
  Locale,
  {
    noRelevantContent: string;
    noAuthorContent: string;
    noDescription: string;
    unknownAuthor: string;
    by: string;
    result: (index: number) => string;
    postCount: (count: number) => string;
    homepage: string;
    currentPage: string;
    description: string;
    type: string;
    author: string;
    year: string;
    tags: string;
    content: string;
    related: (url: string, content: string) => string;
    page: (url: string) => string;
    lookupError: (url: string) => string;
  }
>;

const historyMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
});

const inputSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  sessionId: z.string().uuid(),
  history: z.array(historyMessageSchema).max(50),
  currentPageUrl: z.string().max(500).optional(),
});

type StoredContent<T> = T & { _id: string };
type BlogContent =
  StoredContent<Post> | StoredContent<Page> | StoredContent<Painting>;
type ChatRole = "user" | "assistant" | "system";
type VerifiedUser = Extract<User, { isAuthenticated: true }>;

interface ContactToolContext {
  user: VerifiedUser;
  sessionId: string;
  currentPageUrl: string;
}

interface RoutableContent {
  slug: string;
  slugAsParams: string;
  title: string;
}

function isLocale(value: string): value is Locale {
  return VALID_LOCALES.has(value);
}

function getCorsOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin");
  return origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1"
  );
}

function getDenyHeaders(request: NextRequest): Record<string, string> {
  return {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Access-Control-Allow-Origin": getCorsOrigin(request),
    Vary: "Origin",
  };
}

function getStreamHeaders(request: NextRequest): Record<string, string> {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Access-Control-Allow-Origin": getCorsOrigin(request),
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers": "Content-Type, locale",
    Vary: "Origin",
  };
}

function createStaticStreamResponse(
  request: NextRequest,
  message: string,
): Response {
  const body = [
    `data: ${JSON.stringify({ type: "start" })}`,
    `data: ${JSON.stringify(message)}`,
    "data: [DONE]",
    "",
  ].join("\n\n");

  return new Response(body, { headers: getStreamHeaders(request) });
}

function safeDecodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function encodePathSegment(segment: string): string {
  return encodeURIComponent(safeDecodePathSegment(segment));
}

function getPathSegments(value: string): string[] {
  let pathname: string;

  try {
    pathname = new URL(value, "https://abdulachik.dev").pathname;
  } catch {
    pathname = value.split(/[?#]/, 1)[0] ?? value;
  }

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map(safeDecodePathSegment);

  if (segments[0] && isLocale(segments[0])) {
    return segments.slice(1);
  }

  return segments;
}

function normalizeCollectionSlug(slug: string, collection: string): string {
  const segments = getPathSegments(slug);
  const contentSegments =
    segments[0] === collection ? segments.slice(1) : segments;

  return contentSegments.map(encodePathSegment).join("/");
}

function navigationToken(locale: Locale, pathname: string): string {
  return `[NAVIGATE:${getLocalizedPath(locale, pathname)}]`;
}

function collectionNavigationToken(
  locale: Locale,
  collection: "posts" | "paintings",
  slug: string,
): string {
  const normalizedSlug = normalizeCollectionSlug(slug, collection);
  const pathname = normalizedSlug
    ? `/${collection}/${normalizedSlug}`
    : `/${collection}`;

  return navigationToken(locale, pathname);
}

function getPosts(locale: Locale): Array<StoredContent<Post>> {
  return getContent([], ContentType.POST, locale) as Array<StoredContent<Post>>;
}

function getPaintings(locale: Locale): Array<StoredContent<Painting>> {
  return getContent([], ContentType.PAINTING, locale) as Array<
    StoredContent<Painting>
  >;
}

function getPages(locale: Locale): Array<StoredContent<Page>> {
  return getContent([], ContentType.PAGE, locale) as Array<StoredContent<Page>>;
}

function findContentBySlug<T extends RoutableContent>(
  content: readonly T[],
  slug: string,
  fullSlug: string,
): T | undefined {
  const exactMatch = content.find(
    (item) =>
      item.slugAsParams === slug ||
      item.slugAsParams === fullSlug ||
      item.slug === `/${slug}` ||
      item.slug === `/${fullSlug}`,
  );

  if (exactMatch) return exactMatch;

  const normalizedSlug = slug.toLocaleLowerCase();
  return content.find(
    (item) =>
      item.slugAsParams.includes(slug) ||
      item.slug.includes(slug) ||
      item.title.toLocaleLowerCase().includes(normalizedSlug),
  );
}

function formatCurrentPageContent(
  content: BlogContent,
  locale: Locale,
): string {
  const copy = TOOL_COPY[locale];
  const author = "author" in content ? content.author : null;
  const year = "year" in content ? content.year : null;
  const lines = [
    `**${copy.currentPage}: ${content.title}**`,
    content.description ? `${copy.description}: ${content.description}` : null,
    content.type ? `${copy.type}: ${content.type}` : null,
    author ? `${copy.author}: ${author}` : null,
    year ? `${copy.year}: ${year}` : null,
    content.tags?.length ? `${copy.tags}: ${content.tags.join(", ")}` : null,
    content.content
      ? `\n${copy.content}:\n${content.content.substring(0, 1000)}...`
      : null,
  ];

  return lines
    .filter((line): line is string => typeof line === "string")
    .join("\n");
}

const createTools = (locale: Locale, contactContext?: ContactToolContext) => ({
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
      const results = await searchSimilarContent(query, locale, limit);
      if (results.length === 0) return TOOL_COPY[locale].noRelevantContent;

      return results
        .map(
          (result, index) =>
            `[${TOOL_COPY[locale].result(index + 1)}]\n${result.content}\n---`,
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
      "Provide a clickable navigation link to a specific blog post. Use when the user wants to read a post.",
    inputSchema: z.object({
      slug: z.string().describe("The post slug or URL path"),
    }),
    execute: ({ slug }) => collectionNavigationToken(locale, "posts", slug),
  }),

  navigateToPainting: tool({
    description:
      "Provide a clickable navigation link to a specific painting. Use when the user wants to view a painting.",
    inputSchema: z.object({
      slug: z.string().describe("The painting slug or URL path"),
    }),
    execute: ({ slug }) => collectionNavigationToken(locale, "paintings", slug),
  }),

  navigateToTag: tool({
    description:
      "Provide a clickable navigation link to view all content with a specific tag.",
    inputSchema: z.object({
      tag: z.string().describe("The tag name"),
    }),
    execute: ({ tag }) =>
      navigationToken(locale, `/tags/${encodePathSegment(tag)}`),
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
    execute: ({ limit }) =>
      getPosts(locale)
        .slice(0, limit)
        .map(
          (post) =>
            `- **${post.title}** ${collectionNavigationToken(locale, "posts", post.slugAsParams)}\n  ${post.description || TOOL_COPY[locale].noDescription}`,
        )
        .join("\n\n"),
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
    execute: ({ limit }) =>
      getPaintings(locale)
        .slice(0, limit)
        .map(
          (painting) =>
            `- **${painting.title}** ${TOOL_COPY[locale].by} ${painting.author || TOOL_COPY[locale].unknownAuthor} ${collectionNavigationToken(locale, "paintings", painting.slugAsParams)}\n  ${painting.description || TOOL_COPY[locale].noDescription}`,
        )
        .join("\n\n"),
  }),

  listPopularTags: tool({
    description: "Get a list of popular or available tags in the blog.",
    inputSchema: z.object({}),
    execute: () => {
      const tagCounts = getPosts(locale).reduce<Record<string, number>>(
        (counts, post) => {
          post.tags?.forEach((tag) => {
            counts[tag] = (counts[tag] ?? 0) + 1;
          });
          return counts;
        },
        {},
      );

      return Object.entries(tagCounts)
        .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
        .slice(0, 10)
        .map(
          ([tag, count]) =>
            `- ${tag} (${TOOL_COPY[locale].postCount(count)}) ${navigationToken(locale, `/tags/${encodePathSegment(tag)}`)}`,
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
      const results = await searchSimilarContent(
        `Abdul Hamid ${query}`,
        locale,
        5,
      );
      if (results.length === 0) {
        return TOOL_COPY[locale].noAuthorContent;
      }

      return results
        .map(
          (result, index) =>
            `[${TOOL_COPY[locale].result(index + 1)}]\n${result.content}\n---`,
        )
        .join("\n\n");
    },
  }),

  getCurrentPageContent: tool({
    description:
      'Get detailed information about the page the user is currently viewing. Use this when the user asks about "this post", "this painting", or "the current page". You must use the exact currentPageUrl provided in the system prompt.',
    inputSchema: z.object({
      url: z
        .string()
        .describe(
          'The exact current page URL from the system prompt, such as "/posts/city-a-poem-from-vladimir-kotlyarov"',
        ),
    }),
    execute: async ({ url }) => {
      try {
        const urlParts = getPathSegments(url);
        if (urlParts.length === 0) return TOOL_COPY[locale].homepage;

        const contentType = urlParts[0];
        const slug = urlParts.slice(1).join("/");
        const fullSlug = urlParts.join("/");
        let content: BlogContent | undefined;

        if (contentType === "posts" && slug) {
          content = findContentBySlug(getPosts(locale), slug, fullSlug);
        } else if (contentType === "paintings" && slug) {
          content = findContentBySlug(getPaintings(locale), slug, fullSlug);
        } else {
          content = getPages(locale).find(
            (page) =>
              page.slugAsParams === contentType ||
              page.slug === `/${contentType}`,
          );
        }

        if (!content) {
          const [relatedContent] = await searchSimilarContent(
            slug || contentType,
            locale,
            1,
          );

          if (relatedContent) {
            return TOOL_COPY[locale].related(
              url,
              `${relatedContent.content.substring(0, 200)}...`,
            );
          }

          return TOOL_COPY[locale].page(url);
        }

        return formatCurrentPageContent(content, locale);
      } catch (error) {
        console.error("Current page lookup failed", error);
        return TOOL_COPY[locale].lookupError(url);
      }
    },
  }),

  ...(contactContext
    ? {
        sendMessageToOwner: tool({
          description:
            "Send one real email to Abdul Hamid only when the authenticated visitor explicitly asks to send, email, or contact him and has supplied or approved the message. Never call this tool merely to draft text, discuss contacting him, ask for an address, or infer consent. The server supplies the verified Reply-To address; never ask the model for it.",
          inputSchema: z.object({
            subject: z
              .string()
              .trim()
              .min(1)
              .max(120)
              .describe(
                "A concise subject approved or requested by the visitor",
              ),
            message: z
              .string()
              .trim()
              .min(1)
              .max(3000)
              .describe(
                "The complete message the visitor explicitly wants sent",
              ),
          }),
          execute: async ({ subject, message }) => {
            const copy = CONTACT_TOOL_COPY[locale];

            try {
              const contactLimit = await checkContactRateLimit(
                contactContext.user.id,
              );
              if (!contactLimit.allowed) {
                return {
                  status: "rate_limited" as const,
                  message: copy.rateLimited,
                };
              }

              await sendConciergeMessageEmail({
                subject,
                message,
                senderEmail: contactContext.user.email,
                locale,
                sessionId: contactContext.sessionId,
                currentPageUrl: contactContext.currentPageUrl,
              });

              return { status: "sent" as const, message: copy.sent };
            } catch (error) {
              console.error("Concierge contact action failed", {
                errorName: error instanceof Error ? error.name : "UnknownError",
              });
              return {
                status: "unavailable" as const,
                message: copy.unavailable,
              };
            }
          },
        }),
      }
    : {}),
});

async function ensureChatSession(
  sessionId: string,
  userId: string | null = null,
) {
  try {
    const existing = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.sessionId, sessionId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(chatSessions).values({ sessionId, userId });
    }
  } catch {
    // Persistence is optional; chat remains available if its tables are absent.
  }
}

async function saveChatMessage(
  sessionId: string,
  role: ChatRole,
  content: string,
  tokens?: number,
) {
  try {
    await db.insert(chatMessages).values({
      sessionId,
      role,
      content,
      tokens: tokens ?? null,
    });
  } catch {
    // Persistence is optional; chat remains available if its tables are absent.
  }
}

export async function POST(request: NextRequest) {
  const rawLocale = request.headers.get("locale") ?? Locale.EN;
  const locale = isLocale(rawLocale) ? rawLocale : Locale.EN;
  const responseCopy = STREAM_RESPONSE_COPY[locale];

  try {
    const body: unknown = await request.json();
    const { message, sessionId, history, currentPageUrl } =
      inputSchema.parse(body);

    const clientIp = getClientIp(request);

    if (await isIpBlocked(clientIp)) {
      return new Response(responseCopy.accessDenied, {
        status: 403,
        headers: getDenyHeaders(request),
      });
    }

    const ipRateLimit = await checkIpRateLimit(clientIp);
    if (!ipRateLimit.allowed) {
      return new Response(responseCopy.rateLimitExceeded, {
        status: 429,
        headers: { ...getDenyHeaders(request), "Retry-After": "60" },
      });
    }

    const moderation = moderateInput(message);
    if (moderation.result === ModerationResult.SUPPORT) {
      return createStaticStreamResponse(
        request,
        getCrisisSupportMessage(locale),
      );
    }

    if (moderation.result === ModerationResult.BLOCK) {
      await recordAbuseStrike(clientIp);
      return createStaticStreamResponse(
        request,
        getModerationBlockMessage(locale),
      );
    }

    const user = await getAuthenticatedUser();
    if (!user.isAuthenticated) {
      const messageCount = await getMessageCount(sessionId);
      if (messageCount >= FREE_MESSAGE_LIMIT) {
        return new Response(responseCopy.authenticationRequired, {
          status: 401,
          headers: getDenyHeaders(request),
        });
      }
    }

    const userId = user.isAuthenticated ? user.id : `session-${sessionId}`;
    if (await isUserBlocked(userId)) {
      return new Response(responseCopy.accessDenied, {
        status: 403,
        headers: getDenyHeaders(request),
      });
    }

    const rateLimitResult = await checkRateLimit(userId, "stream");
    if (!rateLimitResult.allowed) {
      return new Response(responseCopy.rateLimitExceeded, {
        status: 429,
        headers: { ...getDenyHeaders(request), "Retry-After": "60" },
      });
    }

    await ensureChatSession(sessionId, user.isAuthenticated ? userId : null);

    const tools = createTools(
      locale,
      user.isAuthenticated
        ? {
            user,
            sessionId,
            currentPageUrl: currentPageUrl ?? getLocalizedPath(locale, "/"),
          }
        : undefined,
    );
    const defaultParams = getDefaultPromptParams(locale);
    const systemPrompt = getPromptWithParams(
      "smerdyakov-personality",
      locale,
      defaultParams,
    );
    const toolInstructions = getPromptWithParams("tool-instructions", locale, {
      ...defaultParams,
      currentPageUrl: currentPageUrl ?? getLocalizedPath(locale, "/"),
    });

    if (!systemPrompt) {
      console.warn("System prompt is empty; using the route fallback context.");
    }

    let finalSystemPrompt = [systemPrompt, toolInstructions]
      .filter(Boolean)
      .join("\n\n");
    finalSystemPrompt += `\n\n${getIdentityContext(locale, isSiteOwner(user))}`;

    if (isCurrentProjectQuery(message)) {
      finalSystemPrompt += `\n\nAUTHORITATIVE CURRENT PROJECT CONTEXT:\n${formatCurrentProjectContext(locale)}\nUse this exact curated sequence when answering the current-work question.`;
    }

    if (currentPageUrl) {
      const pageContextPrompt = getPromptWithParams("page-context", locale, {
        ...defaultParams,
        currentPageUrl,
      });

      if (pageContextPrompt) {
        finalSystemPrompt += `\n\n${pageContextPrompt}`;
      } else {
        console.warn(
          "Page context prompt is missing; using the route fallback context.",
        );
        finalSystemPrompt += `\n\nIMPORTANT: The user is currently viewing this page: ${currentPageUrl}.

When the user asks about "this page", "this post", "this article", or anything about what they are currently reading, call getCurrentPageContent with the exact URL "${currentPageUrl}". Never substitute a generic URL such as "/current-page".`;
      }
    }

    finalSystemPrompt += `\n\n${LANGUAGE_INSTRUCTIONS[locale]}`;

    const messages: ModelMessage[] = [
      ...history.map(({ role, content }) => ({ role, content })),
      { role: "user", content: message },
    ];

    const generationAbortController = new AbortController();
    const abortFromRequest = () =>
      generationAbortController.abort(request.signal.reason);

    if (request.signal.aborted) {
      abortFromRequest();
    } else {
      request.signal.addEventListener("abort", abortFromRequest, {
        once: true,
      });
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let closed = false;

        const send = (payload: string): boolean => {
          if (closed) return false;

          try {
            controller.enqueue(TEXT_ENCODER.encode(`data: ${payload}\n\n`));
            return true;
          } catch {
            closed = true;
            return false;
          }
        };

        const close = () => {
          if (closed) return;
          closed = true;
          try {
            controller.close();
          } catch {
            // The client may have cancelled while generation was completing.
          }
        };

        try {
          if (generationAbortController.signal.aborted) return;

          if (!send(JSON.stringify({ type: "start" }))) return;

          const result = streamText({
            model: conciergeModel,
            instructions: finalSystemPrompt,
            messages,
            tools,
            stopWhen: isStepCount(3),
            abortSignal: generationAbortController.signal,
            providerOptions: getConciergeProviderOptions({
              feature: "concierge-stream",
              user: userId,
              locale,
            }),
            onEnd: async ({ text, usage }) => {
              await saveChatMessage(
                sessionId,
                "user",
                message,
                usage.inputTokens ?? 0,
              );
              await saveChatMessage(
                sessionId,
                "assistant",
                text,
                usage.outputTokens ?? 0,
              );
            },
          });

          for await (const delta of result.textStream) {
            if (!send(JSON.stringify(delta))) break;
          }

          if (!generationAbortController.signal.aborted) {
            send("[DONE]");
          }
        } catch (error) {
          if (!generationAbortController.signal.aborted) {
            console.error("Chat generation stream failed", error);
            send(
              JSON.stringify({
                type: "error",
                error: responseCopy.generationFailed,
              }),
            );
          }
        } finally {
          request.signal.removeEventListener("abort", abortFromRequest);
          close();
        }
      },
      cancel(reason) {
        generationAbortController.abort(reason);
      },
    });

    return new Response(stream, { headers: getStreamHeaders(request) });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return new Response(responseCopy.invalidInput, {
        status: 400,
        headers: getDenyHeaders(request),
      });
    }

    console.error("Chat stream endpoint failed", error);
    return new Response(responseCopy.internalError, {
      status: 500,
      headers: getDenyHeaders(request),
    });
  }
}

export function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": getCorsOrigin(request),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, locale",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    },
  });
}
