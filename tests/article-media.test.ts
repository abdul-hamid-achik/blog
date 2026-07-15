import { hasInlineHero } from "@/lib/article-media";
import { describe, expect, it } from "vitest";

describe("article media", () => {
  const hero = "/paintings/hero.jpg";

  it("recognizes a matching image at the beginning of an article", () => {
    const content = `
      <Image
        className="w-full"
        src="/paintings/hero.jpg"
        width={1080}
        height={720}
        alt="The artwork"
      />

      The opening paragraph.
    `;

    expect(hasInlineHero(content, hero)).toBe(true);
  });

  it("recognizes linked and commented leading images", () => {
    const content = `
      <!-- Keep the painting connected to its catalog entry. -->
      <Link href="/paintings/hero">
        <Image src={'/paintings/hero.jpg'} alt="The artwork" />
      </Link>

      _The artwork, 1907_
    `;

    expect(hasInlineHero(content, hero)).toBe(true);
  });

  it("supports single-quoted image paths", () => {
    expect(
      hasInlineHero(
        "<figure><Image src='/paintings/hero.jpg' /></figure>",
        hero,
      ),
    ).toBe(true);
  });

  it("keeps the page hero when the first inline image is different", () => {
    expect(
      hasInlineHero(
        '<Image src="/paintings/another-work.jpg" alt="Another work" />',
        hero,
      ),
    ).toBe(false);
  });

  it("recognizes matching media that appears after prose", () => {
    expect(
      hasInlineHero(
        'An opening paragraph.\n\n<Image src="/paintings/hero.jpg" />',
        hero,
      ),
    ).toBe(true);
  });

  it("keeps the page hero for missing metadata or malformed image markup", () => {
    expect(hasInlineHero('<Image alt="No source" />', hero)).toBe(false);
    expect(hasInlineHero('<Image src="/paintings/hero.jpg" />')).toBe(false);
    expect(hasInlineHero("The opening paragraph.", hero)).toBe(false);
  });
});
