import { describe, expect, it } from "vitest";

import en from "../translations/en.json";
import es from "../translations/es.json";
import ru from "../translations/ru.json";

interface Messages {
  [key: string]: string | Messages;
}

type FlatMessage = readonly [key: string, value: string];

function flattenMessages(messages: Messages, prefix = ""): FlatMessage[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string"
      ? [[path, value] as const]
      : flattenMessages(value, path);
  });
}

function argumentNames(message: string) {
  return [...message.matchAll(/\{\s*([\w]+)(?:\s*[,}])/g)]
    .map((match) => match[1])
    .sort();
}

const locales: Record<"en" | "es" | "ru", Messages> = { en, es, ru };
const englishMessages = new Map(flattenMessages(en));

describe("UI translations", () => {
  it.each(Object.entries(locales))(
    "%s has the complete English key set",
    (locale, messages) => {
      const localizedMessages = new Map(flattenMessages(messages));

      expect([...localizedMessages.keys()].sort()).toEqual(
        [...englishMessages.keys()].sort(),
      );

      for (const [key, value] of localizedMessages) {
        expect(value.trim(), `${locale}:${key}`).not.toBe("");
      }
    },
  );

  it.each(["es", "ru"] as const)(
    "%s preserves every ICU argument used by English",
    (locale) => {
      const localizedMessages = new Map(flattenMessages(locales[locale]));

      for (const [key, englishValue] of englishMessages) {
        expect(
          argumentNames(localizedMessages.get(key) ?? ""),
          `${locale}:${key}`,
        ).toEqual(argumentNames(englishValue));
      }
    },
  );
});
