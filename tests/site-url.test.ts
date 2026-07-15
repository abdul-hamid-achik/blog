import { describe, expect, it } from "vitest";

import {
  getLocaleSwitchPath,
  getLocalizedPath,
  getLocalizedUrl,
  getOgImageUrl,
} from "../lib/site-url";

describe("getLocaleSwitchPath", () => {
  it("preserves stable routes and safely exits translated tag archives", () => {
    expect(getLocaleSwitchPath("/projects")).toBe("/projects");
    expect(getLocaleSwitchPath("/tags/Psychoanalysis")).toBe("/essays");
    expect(getLocaleSwitchPath("/es/tags/Psicoanálisis")).toBe("/essays");
    expect(getLocaleSwitchPath(undefined)).toBe("/");
  });
});

describe("getLocalizedPath", () => {
  it("keeps the default English locale unprefixed", () => {
    expect(getLocalizedPath("en")).toBe("/");
    expect(getLocalizedPath("en", "/projects")).toBe("/projects");
    expect(getLocalizedPath("en", "essays")).toBe("/essays");
  });

  it("prefixes Spanish and Russian paths, including their home pages", () => {
    expect(getLocalizedPath("es")).toBe("/es");
    expect(getLocalizedPath("es", "/projects")).toBe("/es/projects");
    expect(getLocalizedPath("ru", "essays")).toBe("/ru/essays");
  });
});

describe("getLocalizedUrl", () => {
  it("joins localized paths to bases with or without a trailing slash", () => {
    expect(getLocalizedUrl("en", "/projects", "https://example.test/")).toBe(
      "https://example.test/projects",
    );
    expect(getLocalizedUrl("es", "/", "https://example.test")).toBe(
      "https://example.test/es",
    );
    expect(getLocalizedUrl("ru", "essays", "https://example.test/")).toBe(
      "https://example.test/ru/essays",
    );
  });
});

describe("getOgImageUrl", () => {
  it("builds encoded, localized Open Graph image URLs", () => {
    expect(getOgImageUrl("Эссе & tools", "ru", "https://example.test")).toBe(
      "https://example.test/api/og?title=%D0%AD%D1%81%D1%81%D0%B5+%26+tools&locale=ru",
    );
  });
});
