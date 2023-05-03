"use client"
import { allPosts } from "@/.contentlayer/generated"
import Link from "next/link"
import { DateTime } from "luxon"
import { Disclosure } from "@headlessui/react"

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
              <Disclosure>
                <Disclosure.Button className="mt-4 text-sm">
                  {post.tags.length} tags
                </Disclosure.Button>
                <Disclosure.Panel>
                  <div className="my-4 flex flex-wrap">
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
                </Disclosure.Panel>
              </Disclosure>
            )}
            <hr className="my-4" />
          </article>
        ))}
    </div>
  )
}
