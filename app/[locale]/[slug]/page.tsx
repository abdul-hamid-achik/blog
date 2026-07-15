import { Mdx } from "@/components/mdx-components";
import { getPage } from "@/lib/data";
import { getLocalizedUrl, getOgImageUrl } from "@/lib/site-url";
import { getBaseURL } from "@/lib/utils";
import { locales } from "@/navigation";
import { allPages } from "content-collections";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const page = getPage({ slug: decodeURIComponent(slug), locale });

  if (!page) {
    return {};
  }

  const baseUrl = getBaseURL();
  const canonicalUrl = getLocalizedUrl(
    locale,
    `/${page.slugAsParams}`,
    baseUrl,
  );
  const availableTranslations = Object.fromEntries(
    allPages
      .filter((candidate) => candidate.slugAsParams === page.slugAsParams)
      .map((candidate) => [
        candidate.locale,
        getLocalizedUrl(
          candidate.locale,
          `/${candidate.slugAsParams}`,
          baseUrl,
        ),
      ]),
  );

  return {
    metadataBase: new URL(baseUrl),
    title: page.title,
    description: page.description || undefined,
    alternates: {
      canonical: canonicalUrl,
      languages: availableTranslations,
    },
    openGraph: {
      title: page.title,
      description: page.description || undefined,
      type: "website",
      url: canonicalUrl,
      images: [{ url: getOgImageUrl(page.title, locale, baseUrl) }],
    },
  };
}

export function generateStaticParams() {
  return allPages
    .filter((page) => page.slugAsParams !== "essays")
    .map((page) => ({
      slug: page.slugAsParams,
      locale: page.locale,
    }));
}

export default async function PagePage({ params }: PageProps) {
  const { slug, locale } = await params;
  const isValidLocale = locales.some((cur) => cur === locale);

  if (!isValidLocale) notFound();

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Archive" });
  const page = getPage({ slug: decodeURIComponent(slug), locale });

  if (!page) {
    notFound();
  }

  return (
    <article className="reading-shell py-16 sm:py-24">
      <header className="border-b border-border pb-10">
        <p className="eyebrow">
          {t("kicker")} / {locale.toUpperCase()}
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
          {page.title}
        </h1>
        {page.description && (
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {page.description}
          </p>
        )}
      </header>
      <div className="prose dark:prose-invert pt-10">
        <Mdx code={page.mdx} />
      </div>
    </article>
  );
}
