import { notFound } from "next/navigation"
import { allPosts } from "contentlayer/generated"

import { Metadata } from "next"
import { Mdx } from "@/components/mdx-components"
import { useLocale } from "next-intl"

interface PostProps {
  params: {
    slug: string[]
  }
}

async function getPostFromParams(
  params: PostProps["params"],
  locale: string = "en"
) {
  const slug = params?.slug?.join("/")
  const post = allPosts.find(
    (post) => post.slugAsParams === slug && post.locale === locale
  )

  if (!post) {
    return null
  }

  return post
}

export async function generateMetadata({
  params,
}: PostProps): Promise<Metadata> {
  const post = await getPostFromParams(params)

  if (!post) {
    return {}
  }

  return {
    title: post.title,
    description: post.description,
  }
}

export async function generateStaticParams(): Promise<PostProps["params"][]> {
  return allPosts.map((post) => ({
    slug: post.slugAsParams.split("/"),
  }))
}

export default async function PostPage({ params }: PostProps) {
  const locale = useLocale()
  const post = await getPostFromParams(params, locale)

  if (!post) {
    notFound()
  }

  return (
    <article className="prose dark:prose-invert py-6">
      <h1 className="mb-2 text-xl md:text-4xl">{post.title}</h1>
      {post.description && (
        <p className="text-md mt-0 text-slate-700 dark:text-slate-200 md:text-xl">
          {post.description}
        </p>
      )}
      <hr className="my-4" />
      <Mdx code={post.body.code} />
    </article>
  )
}
