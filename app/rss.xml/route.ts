import { allPosts } from "content-collections";
import { getBaseURL } from "@/lib/utils";
import { getLocalizedUrl } from "@/lib/site-url";

const feedCopy = {
  en: {
    description:
      "Independent software, local-first agent systems, and essays on art, politics, and the unconscious.",
  },
  es: {
    description:
      "Software independiente, sistemas locales para agentes y ensayos sobre arte, política y el inconsciente.",
  },
  ru: {
    description:
      "Независимые программы, локальные системы для агентов и эссе об искусстве, политике и бессознательном.",
  },
} as const;

type FeedLocale = keyof typeof feedCopy;

function getFeedLocale(value: string | null): FeedLocale {
  return value === "es" || value === "ru" ? value : "en";
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeCdata(value: string) {
  return value.replace(/]]>/g, "]]]]><![CDATA[>");
}

export function GET(request: Request) {
  const baseUrl = getBaseURL();
  const locale = getFeedLocale(new URL(request.url).searchParams.get("locale"));
  const posts = allPosts
    .filter((post) => post.public !== false && post.locale === locale)
    .sort((a, b) => {
      const dateA = new Date(a.date || "");
      const dateB = new Date(b.date || "");
      return dateB.getTime() - dateA.getTime();
    });

  const rssItems = posts
    .map((post) => {
      const url = getLocalizedUrl(post.locale, `/posts/${post.slugAsParams}`);

      return `    <item>
      <title><![CDATA[${escapeCdata(post.title)}]]></title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description><![CDATA[${escapeCdata(post.description || "")}]]></description>
      <pubDate>${new Date(post.date || "").toUTCString()}</pubDate>
      ${post.tags?.map((tag) => `<category>${escapeXml(tag)}</category>`).join("\n      ") || ""}
    </item>`;
    })
    .join("\n");

  const feedUrl = new URL("/rss.xml", baseUrl);
  feedUrl.searchParams.set("locale", locale);

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Abdul Hamid</title>
    <link>${getLocalizedUrl(locale, "/", baseUrl)}</link>
    <description>${feedCopy[locale].description}</description>
    <language>${locale}</language>
    <atom:link href="${escapeXml(feedUrl.toString())}" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=3600",
    },
  });
}
