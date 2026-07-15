import { describe, expect, it, vi } from "vitest";

import {
  getContent,
  getPage,
  getPainting,
  getPost,
  getPosts,
} from "../lib/data";
import {
  getDefaultPromptParams,
  getIdentityContext,
  getPromptWithParams,
} from "../lib/prompts";
import { ContentType, Locale } from "../lib/types";

describe("content access", () => {
  it("finds localized posts and returns null for unknown entries", () => {
    const englishPosts = getPosts({ locale: Locale.EN });
    expect(englishPosts).not.toBeNull();

    const sample = englishPosts?.[0];
    expect(sample).toBeDefined();
    expect(
      getPost({ slug: sample?.slugAsParams, locale: Locale.EN }),
    ).toMatchObject({ slugAsParams: sample?.slugAsParams, locale: Locale.EN });
    expect(getPost({ slug: "missing-post", locale: Locale.EN })).toBeNull();
  });

  it("combines every post filter and defaults to public content", () => {
    const sample = getPosts({ locale: Locale.ES })?.find(
      (post) => post.tags && post.tags.length > 0 && post.description,
    );
    expect(sample).toBeDefined();

    expect(
      getPosts({
        slug: sample?.slugAsParams.slice(0, 8),
        tag: sample?.tags?.[0],
        locale: sample?.locale,
        title: sample?.title.slice(0, 8),
        description: sample?.description?.slice(0, 8) ?? undefined,
        date: sample?.date ?? undefined,
        public: true,
      }),
    ).toContainEqual(sample);

    expect(getPosts({ title: "title-that-does-not-exist" })).toBeNull();
    expect(getPosts({ public: false })).toBeNull();
    expect(getPosts()).not.toBeNull();
  });

  it("finds paintings and pages with locale defaults", () => {
    const paintings = getContent([], ContentType.PAINTING, Locale.EN);
    const painting = paintings[0];
    expect(painting).toBeDefined();
    expect(getPainting({ slug: painting.slugAsParams })).toMatchObject({
      slugAsParams: painting.slugAsParams,
      locale: Locale.EN,
    });
    expect(
      getPainting({ slug: "missing-painting", locale: Locale.RU }),
    ).toBeNull();

    const page = getPage({ locale: Locale.RU });
    expect(page?.locale).toBe(Locale.RU);
    expect(getPage({ slug: "missing-page", locale: Locale.EN })).toBeNull();
  });

  it("filters content by type, locale, and stable IDs", () => {
    const spanishPages = getContent([], ContentType.PAGE, Locale.ES);
    expect(spanishPages.length).toBeGreaterThan(0);
    expect(
      spanishPages.every(
        (document) =>
          document.type === ContentType.PAGE &&
          document.locale === Locale.ES &&
          document._id === document._meta.path,
      ),
    ).toBe(true);

    const selected = getContent([spanishPages[0]._id]);
    expect(selected).toHaveLength(1);
    expect(selected[0]._id).toBe(spanishPages[0]._id);
    expect(getContent(["missing-id"])).toEqual([]);
    expect(getContent().length).toBeGreaterThan(spanishPages.length);
  });
});

describe("prompt assembly", () => {
  it("loads localized templates and replaces every supplied parameter", () => {
    const params = getDefaultPromptParams(Locale.ES);
    const prompt = getPromptWithParams(
      "smerdyakov-personality",
      Locale.ES,
      params,
    );

    expect(prompt).toContain(params.authorName);
    expect(prompt).toContain(params.authorLocation);
    expect(prompt).not.toContain("{authorName}");
  });

  it("returns an empty string and warns for unknown prompts", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(getPromptWithParams("missing-prompt", Locale.EN)).toBe("");
    expect(warning).toHaveBeenCalledWith(
      "Prompt not found: missing-prompt for locale en",
    );
    expect(warning).toHaveBeenCalledWith(
      "Empty prompt template for missing-prompt (en)",
    );
  });

  it("provides locale-specific defaults and all owner/visitor contexts", () => {
    expect(getDefaultPromptParams()).toEqual(getDefaultPromptParams(Locale.EN));
    expect(getDefaultPromptParams(Locale.ES).authorLocation).toContain(
      "México",
    );
    expect(getDefaultPromptParams(Locale.RU).authorName).toBe("Абдул Хамид");

    for (const locale of [Locale.EN, Locale.ES, Locale.RU]) {
      const owner = getIdentityContext(locale, true);
      const visitor = getIdentityContext(locale, false);

      expect(owner).toContain(getDefaultPromptParams(locale).authorName);
      expect(visitor).toContain(getDefaultPromptParams(locale).authorName);
      expect(owner).not.toBe(visitor);
    }
  });
});
