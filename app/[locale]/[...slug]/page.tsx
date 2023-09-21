import { Mdx } from "@/components/mdx-components"
import { getBaseURL } from "@/lib/utils"
import { allPages } from "contentlayer/generated"
import { Metadata } from "next"
import { useLocale } from "next-intl"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    slug: string[]
  }
}

async function getPageFromParams(
  params: PageProps["params"],
  locale: string = "en"
) {
  const slug = params?.slug?.join("/")
  const page = allPages.find(
    (page) => page.slugAsParams === slug && page.locale === locale
  )

  if (!page) {
    return null
  }

  return page
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const page = await getPageFromParams(params)

  if (!page) {
    return {}
  }

  return {
    metadataBase: new URL(getBaseURL()),
    title: page.title,
    description: page.description,
  }
}

export async function generateStaticParams(): Promise<PageProps["params"][]> {
  return allPages.map((page) => ({
    slug: page.slugAsParams.split("/"),
  }))
}

export default async function PagePage({ params }: PageProps) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const locale = useLocale()
  const page = await getPageFromParams(params, locale)

  if (!page) {
    notFound()
  }

  return (
    <article className="prose dark:prose-invert py-6">
      <h1>{page.title}</h1>
      {page.description && <p className="text-xl">{page.description}</p>}
      <hr />
      <Mdx code={page.body.code} />
    </article>
  )
}
