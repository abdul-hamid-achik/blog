import { ArticleJsonLd } from "@/components/json-ld"
import { Mdx } from "@/components/mdx-components"
import { getPainting } from "@/lib/data"
import { getBaseURL } from "@/lib/utils"
import { locales } from "@/navigation"
import { allPaintings } from "content-collections"
import { Metadata } from "next"
import { unstable_setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"

interface PaintingProps {
  params: Promise<{
    slug: string
    locale: string
  }>
}

export async function generateMetadata({
  params,
}: PaintingProps): Promise<Metadata> {
  const { slug, locale } = await params
  const painting = getPainting({
    slug: decodeURIComponent(slug),
    locale,
  })

  if (!painting) {
    return {}
  }

  const baseUrl = getBaseURL()
  const ogImage = `${baseUrl}/api/og?title=${encodeURIComponent(painting.title)}`

  return {
    metadataBase: new URL(baseUrl),
    title: painting.title,
    description: painting.description,
    keywords: painting.tags?.join(", "),
    alternates: {
      canonical: `${baseUrl}/${locale}/paintings/${painting.slugAsParams}`,
      languages: {
        en: `${baseUrl}/en/paintings/${painting.slugAsParams}`,
        es: `${baseUrl}/es/paintings/${painting.slugAsParams}`,
        ru: `${baseUrl}/ru/paintings/${painting.slugAsParams}`,
      },
    },
    twitter: {
      card: "summary_large_image",
      creator: "@abdulachik",
      title: painting.title,
      description: painting.description || undefined,
      images: [{ url: ogImage }],
    },
    openGraph: {
      title: painting.title,
      description: painting.description || undefined,
      type: "article",
      images: [{ url: ogImage }],
      authors: ["Abdul Hamid Achik"],
      url: `${baseUrl}/${locale}/paintings/${painting.slugAsParams}`,
    },
  }
}

export function generateStaticParams() {
  return allPaintings.map((painting) => ({
    slug: painting.slugAsParams,
    locale: painting.locale
  }))
}

export default async function PostPage({ params }: PaintingProps) {
  const { slug, locale } = await params

  const isValidLocale = locales.some((cur) => cur === locale);

  if (!isValidLocale) notFound();

  unstable_setRequestLocale(locale);

  const painting = getPainting({
    slug: decodeURIComponent(slug),
    locale,
  })

  if (!painting) {
    notFound()
  }

  return (
    <>
      <ArticleJsonLd
        title={painting.title}
        description={painting.description}
        image={painting.image}
        slug={painting.slugAsParams}
        locale={locale}
        tags={painting.tags}
        type="paintings"
      />
      <article className="prose dark:prose-invert py-6">
        <h1 className="mb-2 text-xl md:text-4xl">{painting.title}</h1>
      <div className="flex items-center flex-wrap gap-2">
        {painting.author && <p className="text-sm">{painting.author}</p>}
        {painting.author && painting.country && <span>•</span>}
        {painting.country && <p className="text-sm">{painting.country}</p>}
        {painting.country && painting.year && <span>•</span>}
        {painting.year && <p className="text-sm">{painting.year}</p>}
      </div>
      {painting.description && (
        <p className="text-sm mt-0 text-muted-foreground md:text-md">
          {painting.description}
        </p>
      )}
      <hr className="my-4" />
      <Mdx code={painting.mdx} />
    </article>
    </>
  )
}
