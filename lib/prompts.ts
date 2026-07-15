import { Locale, Prompts } from "@/lib/data";
import { allPrompts } from "content-collections";

/**
 * Load all prompts from content collections
 */
function loadPrompts(): Prompts {
  return allPrompts;
}

/**
 * Get a specific prompt by type and locale
 */
function getPrompt(promptType: string, locale: Locale): string {
  try {
    const prompts = loadPrompts();
    const prompt = prompts.find(
      (p) => p.promptType === promptType && p.locale === locale,
    );

    if (!prompt) {
      console.warn(`Prompt not found: ${promptType} for locale ${locale}`);
      return "";
    }

    const content = prompt.content || "";
    if (!content) {
      console.warn(`Prompt content is empty for ${promptType} (${locale})`);
    }

    return content;
  } catch (error) {
    console.error(
      `Error loading prompt ${promptType} for locale ${locale}:`,
      error,
    );
    return "";
  }
}

/**
 * Fill prompt parameters with actual values
 */
function fillPromptParameters(
  promptText: string,
  params: Record<string, string>,
): string {
  let result = promptText;

  Object.entries(params).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(regex, value);
  });

  return result;
}

/**
 * Get a prompt with parameters filled
 */
export function getPromptWithParams(
  promptType: string,
  locale: Locale,
  params: Record<string, string> = {},
): string {
  try {
    const promptTemplate = getPrompt(promptType, locale);
    if (!promptTemplate) {
      console.warn(`Empty prompt template for ${promptType} (${locale})`);
      return "";
    }
    return fillPromptParameters(promptTemplate, params);
  } catch (error) {
    console.error(
      `Error getting prompt with params ${promptType} (${locale}):`,
      error,
    );
    return "";
  }
}

/**
 * Get default parameters for prompts
 */
const DEFAULT_PROMPT_PARAMS = {
  [Locale.EN]: {
    authorName: "Abdul Hamid",
    authorLocation: "Guadalajara, Mexico",
    authorInterests:
      "psychoanalysis, authors like Jacques Lacan and Fyodor Dostoyevsky",
  },
  [Locale.ES]: {
    authorName: "Abdul Hamid",
    authorLocation: "Guadalajara, México",
    authorInterests:
      "el psicoanálisis y pensadores como Jacques Lacan y Fiódor Dostoievski",
  },
  [Locale.RU]: {
    authorName: "Абдул Хамид",
    authorLocation: "Гвадалахары (Мексика)",
    authorInterests:
      "психоанализе и мыслителях вроде Жака Лакана и Фёдора Достоевского",
  },
} satisfies Record<Locale, Record<string, string>>;

export function getDefaultPromptParams(
  locale: Locale = Locale.EN,
): Record<string, string> {
  return DEFAULT_PROMPT_PARAMS[locale];
}

export function getIdentityContext(locale: Locale, isAuthor: boolean): string {
  const { authorName } = getDefaultPromptParams(locale);

  if (locale === Locale.ES) {
    return isAuthor
      ? `CONTEXTO DE IDENTIDAD IMPORTANTE: Estás hablando con el autor del sitio, ${authorName}. Trátalo como propietario del blog; puedes decir «tus publicaciones» o «tus pinturas» y adoptar un tono más familiar.`
      : `CONTEXTO DE IDENTIDAD IMPORTANTE: Estás hablando con una persona que visita el blog de ${authorName}, NO con el autor. Habla del autor en tercera persona («${authorName} escribió…», «su ensayo más reciente…»). No digas «tu blog» ni «tus publicaciones».`;
  }

  if (locale === Locale.RU) {
    return isAuthor
      ? `ВАЖНЫЙ КОНТЕКСТ ЛИЧНОСТИ: Вы разговариваете с автором сайта; его имя — ${authorName}. Обращайтесь к нему как к владельцу блога; можно говорить «ваши публикации» и «ваши картины» и использовать более непринуждённый тон.`
      : `ВАЖНЫЙ КОНТЕКСТ ЛИЧНОСТИ: Вы разговариваете с посетителем блога, автор которого — ${authorName}, а НЕ с самим автором. Говорите об авторе в третьем лице («${authorName} написал…», «его последнее эссе…»). Не говорите «ваш блог» или «ваши публикации».`;
  }

  return isAuthor
    ? `IMPORTANT IDENTITY CONTEXT: You are speaking to the site's author, ${authorName}. Address them as the blog owner; you may say "your posts" or "your paintings" and use a more familiar tone.`
    : `IMPORTANT IDENTITY CONTEXT: You are speaking to a visitor of ${authorName}'s blog, NOT the author. Refer to the author in the third person ("${authorName} wrote…", "his latest essay…"). Do not say "your blog" or "your posts".`;
}
