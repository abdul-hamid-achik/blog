import { allPosts } from "content-collections"
import { getBaseURL } from "@/lib/utils"

export function GET() {
  const baseUrl = getBaseURL()
  const posts = allPosts
    .filter((post) => post.public !== false && post.locale === "en")
    .sort((a, b) => {
      const dateA = new Date(a.date || "")
      const dateB = new Date(b.date || "")
      return dateB.getTime() - dateA.getTime()
    })

  const rssItems = posts
    .map(
      (post) => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/en/posts/${post.slugAsParams}</link>
      <guid isPermaLink="true">${baseUrl}/en/posts/${post.slugAsParams}</guid>
      <description><![CDATA[${post.description || ""}]]></description>
      <pubDate>${new Date(post.date || "").toUTCString()}</pubDate>
      ${post.tags?.map((tag) => `<category>${tag}</category>`).join("\n      ") || ""}
    </item>`
    )
    .join("\n")

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Abdul Hamid</title>
    <link>${baseUrl}</link>
    <description>A Lacanian full-stack developer — arts, culture, and technology.</description>
    <language>en</language>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  })
}
