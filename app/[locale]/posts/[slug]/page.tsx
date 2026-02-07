import { ArticleJsonLd } from "@/components/json-ld"
import { Mdx } from "@/components/mdx-components"
import RelatedPosts from "@/components/related-posts"
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

  const baseUrl = getBaseURL()
  const ogImage = `${baseUrl}/api/og?title=${encodeURIComponent(post.title)}`

  return {
    metadataBase: new URL(baseUrl),
    title: post.title,
    description: post.description,
    keywords: post.tags?.join(", "),
    alternates: {
      canonical: `${baseUrl}/${locale}/posts/${post.slugAsParams}`,
      languages: {
        en: `${baseUrl}/en/posts/${post.slugAsParams}`,
        es: `${baseUrl}/es/posts/${post.slugAsParams}`,
        ru: `${baseUrl}/ru/posts/${post.slugAsParams}`,
      },
    },
    twitter: {
      card: "summary_large_image",
      creator: "@abdulachik",
      title: post.title,
      description: post.description || undefined,
      images: [{ url: ogImage }],
    },
    openGraph: {
      title: post.title,
      description: post.description || undefined,
      type: "article",
      images: [{ url: ogImage }],
      authors: ["Abdul Hamid Achik"],
      url: `${baseUrl}/${locale}/posts/${post.slugAsParams}`,
    },
  }
}

export function generateStaticParams() {
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
    <>
      <ArticleJsonLd
        title={post.title}
        description={post.description}
        date={post.date}
        image={post.image}
        slug={post.slugAsParams}
        locale={locale}
        tags={post.tags}
      />
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
          <p className="text-md mt-0 text-muted-foreground md:text-xl">
            {post.description}
          </p>
        )}
        <hr className="my-4" />
        <Mdx code={post.mdx} />
        <RelatedPosts
          currentSlug={post.slugAsParams}
          locale={locale}
          tags={post.tags}
        />
      </article>
    </>
  )
}
