import { Mdx } from "@/components/mdx-components"
import { getPainting } from "@/lib/data"
import { getBaseURL } from "@/lib/utils"
import { locales } from "@/navigation"
import { allPaintings } from "contentlayer/generated"
import { Metadata } from "next"
import { unstable_setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"

interface PaintingProps {
  params: {
    slug: string
    locale: string
  }
}

export async function generateMetadata({
  params,
}: PaintingProps): Promise<Metadata> {
  const painting = getPainting({
    slug: decodeURIComponent(params?.slug),
    locale: params?.locale,
  })

  if (!painting) {
    return {}
  }

  return {
    metadataBase: new URL(getBaseURL()),
    title: painting.title,
    description: painting.description,
    keywords: painting.tags?.join(", "),
    twitter: {
      card: "summary_large_image",
      creator: "@abdulachik",
      title: painting.title,
      description: painting.description,
      images: [
        {
          url:
            process.env.NODE_ENV === "production"
              ? `https://www.abdulachik.dev/api/og?title=${painting.title}`
              : `http://localhost:3000/api/og?title=${painting.title}`,
        },
      ],
    },
    openGraph: {
      title: painting.title,
      description: painting.description,
      type: "article",
      images: [
        {
          url:
            process.env.NODE_ENV === "production"
              ? `https://www.abdulachik.dev/api/og?title=${painting.title}`
              : `http://localhost:3000/api/og?title=${painting.title}`,
        },
      ],
      authors: ["Abdul Hamid Achik"],
      url: `https://www.abdulachik.dev/paintings/${painting.slugAsParams}`,
    },
  }
}

export async function generateStaticParams(): Promise<PaintingProps["params"][]> {
  return allPaintings.map((painting) => ({
    slug: painting.slugAsParams,
    locale: painting.locale
  }))
}

export default async function PostPage({ params }: PaintingProps) {
  const { locale } = params

  const isValidLocale = locales.some((cur) => cur === locale);

  if (!isValidLocale) notFound();

  unstable_setRequestLocale(locale);

  const painting = getPainting({
    slug: decodeURIComponent(params.slug),
    locale: params.locale,
  })

  if (!painting) {
    notFound()
  }

  return (
    <article className="prose dark:prose-invert py-6">
      <h1 className="mb-2 text-xl md:text-4xl">{painting.title}</h1>
      <div className="flex items-center">
        <p className="text-sm">{painting.author}</p>
        <span className="mx-2">•</span>
        <p className="text-sm">{painting.country}</p>
        <span className="mx-2">•</span>
        <p className="text-sm">{painting.year}</p>
        <span className="mx-2">•</span>
        <p className="text-sm">{painting.readingTime.text}</p>
      </div>
      {painting.description && (
        <p className="text-sm mt-0 text-slate-700 dark:text-slate-200 md:text-md">
          {painting.description}
        </p>
      )}
      <hr className="my-4" />
      <Mdx code={painting.body.code} />
    </article>
  )
}
