import { getLocalizedUrl } from "@/lib/site-url";
import { locales } from "@/navigation";
import { allPages, allPaintings, allPosts } from "content-collections";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const localizedHomes = locales.map((locale) => ({
    url: getLocalizedUrl(locale),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 1,
  }));

  const projectPages = locales.map((locale) => ({
    url: getLocalizedUrl(locale, "/projects"),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  const posts = allPosts
    .filter((post) => post.public)
    .map((post) => ({
      url: getLocalizedUrl(post.locale, `/posts/${post.slugAsParams}`),
      lastModified: post.date ? new Date(post.date) : now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  const pages = allPages
    .filter((page) => page.slugAsParams !== "blocked")
    .map((page) => ({
      url: getLocalizedUrl(page.locale, `/${page.slugAsParams}`),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    }));

  const paintings = allPaintings.map((painting) => ({
    url: getLocalizedUrl(
      painting.locale,
      `/paintings/${painting.slugAsParams}`,
    ),
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  const tags = Array.from(
    new Map(
      allPosts.flatMap((post) =>
        (post.tags ?? []).map((tag) => [
          `${post.locale}:${tag}`,
          {
            url: getLocalizedUrl(
              post.locale,
              `/tags/${encodeURIComponent(tag)}`,
            ),
            lastModified: now,
            changeFrequency: "monthly" as const,
            priority: 0.4,
          },
        ]),
      ),
    ).values(),
  );

  return [
    ...localizedHomes,
    ...projectPages,
    ...posts,
    ...pages,
    ...paintings,
    ...tags,
  ];
}
