import { ArticleJsonLd } from "@/components/json-ld";
import { Mdx } from "@/components/mdx-components";
import { getPainting } from "@/lib/data";
import { getLocalizedUrl, getOgImageUrl } from "@/lib/site-url";
import { getBaseURL } from "@/lib/utils";
import { locales } from "@/navigation";
import { allPaintings } from "content-collections";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

interface PaintingProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: PaintingProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const painting = getPainting({
    slug: decodeURIComponent(slug),
    locale,
  });

  if (!painting) {
    return {};
  }

  const baseUrl = getBaseURL();
  const ogImage = getOgImageUrl(painting.title, locale, baseUrl);
  const availableTranslations = Object.fromEntries(
    allPaintings
      .filter((candidate) => candidate.slugAsParams === painting.slugAsParams)
      .map((candidate) => [
        candidate.locale,
        getLocalizedUrl(
          candidate.locale,
          `/paintings/${candidate.slugAsParams}`,
          baseUrl,
        ),
      ]),
  );
  const canonicalUrl = getLocalizedUrl(
    locale,
    `/paintings/${painting.slugAsParams}`,
    baseUrl,
  );

  return {
    metadataBase: new URL(baseUrl),
    title: painting.title,
    description: painting.description,
    keywords: painting.tags?.join(", "),
    alternates: {
      canonical: canonicalUrl,
      languages: availableTranslations,
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
      url: canonicalUrl,
    },
  };
}

export function generateStaticParams() {
  return allPaintings.map((painting) => ({
    slug: painting.slugAsParams,
    locale: painting.locale,
  }));
}

export default async function PostPage({ params }: PaintingProps) {
  const { slug, locale } = await params;

  const isValidLocale = locales.some((cur) => cur === locale);

  if (!isValidLocale) notFound();

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "PaintingPage" });
  const painting = getPainting({
    slug: decodeURIComponent(slug),
    locale,
  });

  if (!painting) {
    notFound();
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
      <article>
        <header className="site-shell border-x border-border px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="eyebrow">
                {t("kicker")} / {locale.toUpperCase()}
              </p>
              <h1 className="mt-7 max-w-5xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                {painting.title}
              </h1>
              {painting.description && (
                <p className="mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  {painting.description}
                </p>
              )}
            </div>

            {(painting.author || painting.country || painting.year) && (
              <dl className="grid grid-cols-2 border-y border-border sm:grid-cols-3 lg:grid-cols-1">
                {painting.author && (
                  <div className="py-4 sm:px-4 sm:first:pl-0 lg:border-b lg:px-0">
                    <dt className="font-mono text-[0.62rem] uppercase tracking-[0.13em] text-muted-foreground">
                      {t("artist")}
                    </dt>
                    <dd className="mt-1 font-medium">{painting.author}</dd>
                  </div>
                )}
                {painting.country && (
                  <div className="border-l border-border py-4 pl-4 sm:px-4 lg:border-l-0 lg:border-b lg:px-0">
                    <dt className="font-mono text-[0.62rem] uppercase tracking-[0.13em] text-muted-foreground">
                      {t("country")}
                    </dt>
                    <dd className="mt-1 font-medium">{painting.country}</dd>
                  </div>
                )}
                {painting.year && (
                  <div className="border-t border-border py-4 sm:border-t-0 sm:border-l sm:px-4 lg:border-l-0 lg:px-0">
                    <dt className="font-mono text-[0.62rem] uppercase tracking-[0.13em] text-muted-foreground">
                      {t("year")}
                    </dt>
                    <dd className="mt-1 font-medium">{painting.year}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </header>

        <div className="reading-shell border-t border-border pt-12 sm:pt-16">
          <div className="prose dark:prose-invert">
            <Mdx code={painting.mdx} />
          </div>
        </div>
      </article>
    </>
  );
}
