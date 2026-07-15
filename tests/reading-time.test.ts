import { describe, expect, it } from "vitest";

import { calculateReadingTime } from "../lib/reading-time";
import { Locale } from "../lib/types";

describe("calculateReadingTime", () => {
  it("counts Unicode words and keeps apostrophes and hyphens within a word", () => {
    const result = calculateReadingTime(
      "Hola corazón niño. Привет мир данные. don't long-running",
      Locale.EN,
    );

    expect(result.words).toBe(8);
  });

  it("ignores common HTML and Markdown syntax without dropping link text", () => {
    const result = calculateReadingTime(
      "<strong>Hello</strong> [wide world](https://example.com) `today`",
      Locale.EN,
    );

    expect(result.words).toBe(4);
  });

  it("rounds up at the 220-word boundary and reports milliseconds", () => {
    const oneMinute = calculateReadingTime(
      Array.from({ length: 220 }, () => "word").join(" "),
      Locale.EN,
    );
    const twoMinutes = calculateReadingTime(
      Array.from({ length: 221 }, () => "слово").join(" "),
      Locale.RU,
    );

    expect(oneMinute).toMatchObject({ minutes: 1, time: 60_000, words: 220 });
    expect(twoMinutes).toMatchObject({ minutes: 2, time: 120_000, words: 221 });
  });

  it.each([
    [Locale.EN, "1 min read"],
    [Locale.ES, "1 min de lectura"],
    [Locale.RU, "1 мин чтения"],
  ])("uses the %s reading-time label", (locale, text) => {
    expect(calculateReadingTime("one", locale).text).toBe(text);
  });

  it("returns a one-minute English fallback for empty or unknown-locale content", () => {
    expect(calculateReadingTime("", "fr")).toEqual({
      text: "1 min read",
      minutes: 1,
      time: 60_000,
      words: 0,
    });
  });
});
