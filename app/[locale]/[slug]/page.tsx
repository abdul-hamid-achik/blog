import { Mdx } from "@/components/mdx-components";
import { getPage } from "@/lib/data";
import { getBaseURL } from "@/lib/utils";
import { locales } from "@/navigation";
import { allPages } from "contentlayer/generated";
import { Metadata } from "next";
import { unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    locale: string;
    slug: string
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const page = getPage({ slug: decodeURIComponent(params.slug), locale: params.locale })

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
    slug: page.slugAsParams,
    locale: page.locale
  }))
}

export default async function PagePage({ params }: PageProps) {
  const { locale } = params
  const isValidLocale = locales.some((cur) => cur === locale);

  if (!isValidLocale) notFound();

  unstable_setRequestLocale(locale);

  const page = getPage({ slug: decodeURIComponent(params.slug), locale: params.locale })

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
