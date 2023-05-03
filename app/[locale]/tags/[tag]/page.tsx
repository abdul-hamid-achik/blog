import { allPosts } from "@/.contentlayer/generated"
import Link from "next/link"
import { DateTime } from "luxon"
import { Metadata } from "next"

interface TagProps {
  params: {
    tag: string
  }
}

async function getPostsFromParams(
  params: TagProps["params"],
  locale: string = "en"
) {
  const posts = allPosts.filter(
    (post) => post.tags?.includes(params.tag) && post.locale === locale
  )

  if (posts.length === 0 && !posts) {
    return null
  }

  return posts
}
export async function generateMetadata({
  params,
}: TagProps): Promise<Metadata> {
  const posts = await getPostsFromParams(params)

  if (!posts) {
    return {}
  }

  return {
    title: params.tag,
    description: `Posts tagged with ${params.tag}`,
    keywords: posts.map((post) => post.tags?.join(", ")).join(", "),
    openGraph: {
      title: params.tag,
      type: "article",
      images: posts.map((post) => ({
        url:
          process.env.NODE_ENV === "production"
            ? `https://abdulachik.dev/api/og?title=${post.title}`
            : `http://localhost:3000/api/og?title=${post.title}`,
      })),
      authors: ["Abdul Hamid Achik"],
      url: `https://abdulachik.dev/tags/${params.tag}`,
    },
  }
}

export default function TagPage({
  params: { locale, tag },
}: {
  params: { locale: string; tag: string }
}) {
  return (
    <div className="prose dark:prose-invert">
      <h2 className="my-6">#{decodeURIComponent(tag)}</h2>

      {allPosts
        .filter((post) => post.locale === locale)
        .filter((post) => post.tags?.includes(decodeURIComponent(tag)))
        .sort((first, second) => {
          const firstDate = DateTime.fromISO(first.date)
          const secondDate = DateTime.fromISO(second.date)

          return secondDate.toMillis() - firstDate.toMillis()
        })
        .map((post) => (
          <article key={post._id}>
            <Link href={`${locale}${post.slug}`}>
              <h2 className="mb-0">{post.title}</h2>
            </Link>
            <div className="flex items-center">
              <p className="text-sm">
                {DateTime.fromISO(post.date).toRelative()}
              </p>
              <span className="mx-2 my-0">•</span>
              <p className="text-sm">{post.readingTime.text}</p>
            </div>
            {post.description && <p className="m-0">{post.description}</p>}
            {post.tags && (
              <div className="mt-4 flex flex-wrap">
                {post.tags.map((tag) => (
                  <Link
                    href={`${locale}/tags/${tag}`}
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
