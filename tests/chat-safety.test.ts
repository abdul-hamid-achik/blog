import { describe, expect, it } from "vitest";

import {
  getCrisisSupportMessage,
  getModerationBlockMessage,
} from "../lib/chat-safety";
import { Locale } from "../lib/types";

describe("localized chat safety responses", () => {
  it.each([
    [Locale.EN, "Are you in immediate danger right now?"],
    [Locale.ES, "¿Estás en peligro inmediato ahora mismo?"],
    [Locale.RU, "Вы сейчас в непосредственной опасности?"],
  ])("returns actionable crisis support for %s", (locale, closingQuestion) => {
    const message = getCrisisSupportMessage(locale);

    expect(message).toContain("**988**");
    expect(message).toContain("https://988lifeline.org");
    expect(message).toContain("https://findahelpline.com");
    expect(message).toContain(closingQuestion);
  });

  it("includes the Spanish-language 988 instruction only in Spanish copy", () => {
    expect(getCrisisSupportMessage(Locale.ES)).toContain("**AYUDA**");
    expect(getCrisisSupportMessage(Locale.EN)).not.toContain("**AYUDA**");
    expect(getCrisisSupportMessage(Locale.RU)).not.toContain("**AYUDA**");
  });

  it.each([
    [Locale.EN, "I can’t process that request"],
    [Locale.ES, "No puedo procesar esa solicitud"],
    [Locale.RU, "Я не могу обработать этот запрос"],
  ])(
    "returns the localized moderation block response for %s",
    (locale, copy) => {
      const message = getModerationBlockMessage(locale);

      expect(message).toContain(copy);
      expect(message.length).toBeGreaterThan(60);
    },
  );

  it("keeps every locale response distinct and non-empty", () => {
    const crisisMessages = Object.values(Locale).map(getCrisisSupportMessage);
    const blockMessages = Object.values(Locale).map(getModerationBlockMessage);

    expect(new Set(crisisMessages).size).toBe(Object.values(Locale).length);
    expect(new Set(blockMessages).size).toBe(Object.values(Locale).length);
    expect([...crisisMessages, ...blockMessages].every(Boolean)).toBe(true);
  });
});
