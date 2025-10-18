import { Mdx } from "@/components/mdx-components"
import { getPost } from "@/lib/data"
import { getBaseURL } from "@/lib/utils"
import { locales } from "@/navigation"
import { allPosts } from "content-collections"
import { DateTime } from "luxon"
import { Metadata } from "next"
import { unstable_setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"

interface PostProps {
  params: Promise<{
    slug: string
    locale: string
  }>
}

export async function generateMetadata({
  params,
}: PostProps): Promise<Metadata> {
  const { slug, locale } = await params
  const post = getPost({ slug: decodeURIComponent(slug), locale })

  if (!post) {
    return {}
  }

  return {
    metadataBase: new URL(getBaseURL()),
    title: post.title,
    description: post.description,
    keywords: post.tags?.join(", "),
    twitter: {
      card: "summary_large_image",
      creator: "@abdulachik",
      title: post.title,
      description: post.description || undefined,
      images: [
        {
          url:
            process.env.NODE_ENV === "production"
              ? `https://www.abdulachik.dev/api/og?title=${post.title}`
              : `http://localhost:3000/api/og?title=${post.title}`,
        },
      ],
    },
    openGraph: {
      title: post.title,
      description: post.description || undefined,
      type: "article",
      images: [
        {
          url:
            process.env.NODE_ENV === "production"
              ? `https://www.abdulachik.dev/api/og?title=${post.title}`
              : `http://localhost:3000/api/og?title=${post.title}`,
        },
      ],
      authors: ["Abdul Hamid Achik"],
      url: `https://www.abdulachik.dev/posts/${post.slugAsParams}`,
    },
  }
}

export async function generateStaticParams() {
  return allPosts.map((post) => ({
    slug: post.slugAsParams,
    locale: post.locale
  }))
}

export default async function PostPage({ params }: PostProps) {
  const { slug, locale } = await params
  const isValidLocale = locales.some((cur) => cur === locale);

  if (!isValidLocale) notFound();

  unstable_setRequestLocale(locale);

  const post = getPost({ slug: decodeURIComponent(slug), locale })

  if (!post) {
    notFound()
  }

  return (
    <article className="prose dark:prose-invert py-6">
      <h1 className="mb-2 text-xl md:text-4xl">{post.title}</h1>
      <div className="flex items-center">
        {post.date && (
          <>
            <p className="text-sm">{DateTime.fromISO(post.date).toRelative()}</p>
            <span className="mx-2">•</span>
          </>
        )}
        <p className="text-sm">{post.readingTime.text}</p>
      </div>
      {post.description && (
        <p className="text-md mt-0 text-slate-700 dark:text-slate-200 md:text-xl">
          {post.description}
        </p>
      )}
      <hr className="my-4" />
      <Mdx code={post.mdx} />
    </article>
  )
}
