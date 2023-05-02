import { allPosts } from "@/.contentlayer/generated"
import Link from "next/link"
import { DateTime } from "luxon"

export default function Home({
  params: { locale },
}: {
  params: { locale: string }
}) {
  return (
    <div className="prose dark:prose-invert">
      {allPosts
        .filter((post) => post.locale === locale)
        .sort((first, second) => {
          const firstDate = DateTime.fromISO(first.date)
          const secondDate = DateTime.fromISO(second.date)

          return secondDate.toMillis() - firstDate.toMillis()
        })
        .map((post) => (
          <article key={post._id}>
            <Link href={`${locale}${post.slug}`}>
              <h2>{post.title}</h2>
            </Link>
            {post.description && <p>{post.description}</p>}
          </article>
        ))}
    </div>
  )
}
