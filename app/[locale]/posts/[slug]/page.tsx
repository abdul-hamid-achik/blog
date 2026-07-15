import { ArticleJsonLd } from "@/components/json-ld";
import { Mdx } from "@/components/mdx-components";
import RelatedPosts from "@/components/related-posts";
import { hasInlineHero } from "@/lib/article-media";
import { getPost } from "@/lib/data";
import { getLocalizedUrl, getOgImageUrl } from "@/lib/site-url";
import { getBaseURL } from "@/lib/utils";
import { Link, locales } from "@/navigation";
import { allPosts } from "content-collections";
import { DateTime } from "luxon";
import { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

interface PostProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: PostProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = getPost({ slug: decodeURIComponent(slug), locale });

  if (!post) {
    return {};
  }

  const baseUrl = getBaseURL();
  const ogImage = getOgImageUrl(post.title, locale, baseUrl);
  const availableTranslations = Object.fromEntries(
    allPosts
      .filter((candidate) => candidate.slugAsParams === post.slugAsParams)
      .map((candidate) => [
        candidate.locale,
        getLocalizedUrl(
          candidate.locale,
          `/posts/${candidate.slugAsParams}`,
          baseUrl,
        ),
      ]),
  );
  const canonicalUrl = getLocalizedUrl(
    locale,
    `/posts/${post.slugAsParams}`,
    baseUrl,
  );

  return {
    metadataBase: new URL(baseUrl),
    title: post.title,
    description: post.description,
    keywords: post.tags?.join(", "),
    alternates: {
      canonical: canonicalUrl,
      languages: availableTranslations,
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
      url: canonicalUrl,
    },
  };
}

export function generateStaticParams() {
  return allPosts.map((post) => ({
    slug: post.slugAsParams,
    locale: post.locale,
  }));
}

export default async function PostPage({ params }: PostProps) {
  const { slug, locale } = await params;
  const isValidLocale = locales.some((cur) => cur === locale);

  if (!isValidLocale) notFound();

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Article" });
  const post = getPost({ slug: decodeURIComponent(slug), locale });

  if (!post) {
    notFound();
  }

  const formattedDate = post.date
    ? DateTime.fromISO(post.date)
        .setLocale(locale)
        .toLocaleString(DateTime.DATE_MED)
    : null;
  const includesHeroInBody = hasInlineHero(post.content, post.image);

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
      <article>
        <header className="site-shell border-x border-border px-5 pt-16 sm:px-8 lg:px-12 lg:pt-24">
          <div className="mx-auto max-w-5xl text-center">
            <p className="eyebrow">
              {t("essay")} / {locale.toUpperCase()}
            </p>
            <h1 className="mt-7 text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-7xl">
              {post.title}
            </h1>
            {post.description && (
              <p className="mx-auto mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {post.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-[0.64rem] uppercase tracking-[0.12em] text-muted-foreground">
              {formattedDate && (
                <time dateTime={post.date || undefined}>{formattedDate}</time>
              )}
              {formattedDate && <span className="text-border">/</span>}
              <span>{post.readingTime.text}</span>
              <span className="text-border">/</span>
              <span>Abdul Hamid Achik</span>
            </div>
          </div>

          {post.image && !includesHeroInBody && (
            <div
              className="relative mt-10 aspect-[4/3] w-full max-w-full overflow-hidden border-y border-border bg-secondary sm:mt-16 sm:aspect-[16/8.5]"
              data-article-hero
            >
              <Image
                src={post.image}
                alt=""
                fill
                priority
                sizes="(min-width: 1440px) 1280px, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </header>

        <div className="reading-shell pt-12 sm:pt-16">
          <div className="prose dark:prose-invert">
            <Mdx code={post.mdx} />
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-14 border-y border-border py-6">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
                {t("filedUnder")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="border border-border bg-card px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <RelatedPosts
            currentSlug={post.slugAsParams}
            locale={locale}
            tags={post.tags}
          />
        </div>
      </article>
    </>
  );
}
