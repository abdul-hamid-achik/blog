import { allPosts } from "content-collections"
import { getPosts } from "@/lib/data"
import { getBaseURL } from "@/lib/utils"
import { locales } from "@/navigation"
import { Link } from "@/navigation"
import { DateTime } from "luxon"
import { Metadata } from "next"
import { unstable_setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"

interface TagProps {
  params: Promise<{
    tag: string
    locale: string
  }>
}


export async function generateMetadata({
  params,
}: TagProps): Promise<Metadata> {
  const { tag, locale } = await params
  const posts = getPosts({
    tag,
    locale
  })

  if (!posts) {
    return {}
  }

  return {
    metadataBase: new URL(getBaseURL()),
    title: tag,
    description: `Posts tagged with ${tag}`,
    keywords: posts.map((post) => post.tags?.join(", ")).join(", "),
    openGraph: {
      title: tag,
      type: "article",
      images: posts.map((post) => ({
        url:
          process.env.NODE_ENV === "production"
            ? `https://www.abdulachik.dev/api/og?title=${post.title}`
            : `http://localhost:3000/api/og?title=${post.title}`,
      })),
      authors: ["Abdul Hamid Achik"],
      url: `https://www.abdulachik.dev/tags/${tag}`,
    },
  }
}

export function generateStaticParams() {
  const localeTagCache = allPosts.reduce((cache, post) => {
    if (post.locale && post.tags) {
      if (!cache[post.locale]) {
        cache[post.locale] = [];
      }

      cache[post.locale].push(...post.tags);
    }

    return cache;
  }, {} as Record<string, string[]>);

  return Object.entries(localeTagCache).flatMap(([locale, tags]) =>
    tags.map(tag => ({ locale, tag: encodeURIComponent(tag) }))
  );
}

export default async function TagPage({
  params,
}: TagProps) {
  const { locale, tag } = await params
  const isValidLocale = locales.some((cur) => cur === locale);

  if (!isValidLocale) notFound();

  unstable_setRequestLocale(locale);

  const posts = getPosts({
    tag: decodeURIComponent(tag),
    locale
  }) ?? []

  if (posts.length === 0) notFound()

  return (
    <div className="prose dark:prose-invert">
      <h2 className="my-6">#{decodeURIComponent(tag)}</h2>

      {posts
        .sort((first, second) => {
          const firstDate = DateTime.fromISO(first.date || "")
          const secondDate = DateTime.fromISO(second.date || "")

          return secondDate.toMillis() - firstDate.toMillis()
        })
        .map((post) => (
          <article key={post._meta.path}>
            <Link href={`/posts/${post.slug}`}>
              <h2 className="mb-0">{post.title}</h2>
            </Link>
            <div className="flex items-center">
              {post.date && (
                <>
                  <p className="text-sm">
                    {DateTime.fromISO(post.date).toRelative()}
                  </p>
                  <span className="mx-2 my-0">•</span>
                </>
              )}
              <p className="text-sm">{post.readingTime.text}</p>
            </div>
            {post.description && <p className="m-0">{post.description}</p>}
            {post.tags && (
              <div className="mt-4 flex flex-wrap">
                {post.tags.map((tag) => (
                  <Link
                    href={`/tags/${encodeURIComponent(tag)}`}
                    key={tag}
                    className="mr-2 text-sm"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
            <hr className="my-4" />
          </article>
        ))}
    </div>
  )
}
