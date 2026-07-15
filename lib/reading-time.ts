import { Locale } from "./types";

const WORDS_PER_MINUTE = 220;

/**
 * Estimates reading time from human-readable MDX text.
 *
 * Unicode letter and number classes keep the count useful for every supported
 * locale, while common inline HTML and Markdown syntax is excluded from it.
 */
export function calculateReadingTime(content: string, locale: Locale | string) {
  const readableText = content
    .replace(/<[^>]*>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#{}|~]/g, " ");
  const words =
    readableText.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  const labels: Partial<Record<Locale | string, string>> = {
    [Locale.EN]: `${minutes} min read`,
    [Locale.ES]: `${minutes} min de lectura`,
    [Locale.RU]: `${minutes} мин чтения`,
  };

  return {
    text: labels[locale] ?? labels[Locale.EN]!,
    minutes,
    time: minutes * 60_000,
    words,
  };
}
