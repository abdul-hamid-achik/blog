import { allPosts } from "@/.contentlayer/generated"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { getBaseURL } from "@/lib/utils"
import { DateTime } from "luxon"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Page({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const baseUrl = getBaseURL()

  return (
    <div className="prose dark:prose-invert mt-4">
      {allPosts
        .filter((post) => post.locale === locale)
        .sort((first, second) => {
          const firstDate = DateTime.fromISO(first.date)
          const secondDate = DateTime.fromISO(second.date)

          return secondDate.toMillis() - firstDate.toMillis()
        })
        .map((post) => (
          <article key={post._id}>
            <Link href={`${baseUrl}/${locale}${post.slug}`}>
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
              <Collapsible>
                <CollapsibleTrigger>{post.tags.length} tags</CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="my-4 flex flex-wrap">
                    {post.tags.map((tag) => (
                      <Link
                        href={`${baseUrl}/${locale}/tags/${tag}`}
                        key={tag}
                        className="mr-2 text-sm"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            <hr className="my-4" />
          </article>
        ))}
    </div>
  )
}
