const ARTICLE_IMAGE_PATTERN = /<Image\b([\s\S]*?)\/>/gi;

const IMAGE_SOURCE_PATTERN =
  /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|\{\s*(?:"([^"]+)"|'([^']+)')\s*\})/i;

/**
 * Reports whether an article body already contains the image used in its
 * frontmatter. Keeping the authored MDX image preserves its link, alt text,
 * and caption while avoiding a second decorative copy in the page header.
 */
export function hasInlineHero(
  content: string,
  heroImage?: string | null,
): boolean {
  if (!heroImage) {
    return false;
  }

  for (const image of content.matchAll(ARTICLE_IMAGE_PATTERN)) {
    const source = image[1].match(IMAGE_SOURCE_PATTERN);
    const inlineImage = source?.slice(1).find(Boolean);

    if (inlineImage?.trim() === heroImage.trim()) {
      return true;
    }
  }

  return false;
}
