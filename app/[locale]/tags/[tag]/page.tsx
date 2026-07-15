import { allPosts } from "content-collections";
import { getPosts } from "@/lib/data";
import { getLocalizedUrl, getOgImageUrl } from "@/lib/site-url";
import { getBaseURL } from "@/lib/utils";
import { locales } from "@/navigation";
import { Link } from "@/navigation";
import { DateTime } from "luxon";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

interface TagProps {
  params: Promise<{
    tag: string;
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: TagProps): Promise<Metadata> {
  const { tag, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Archive" });
  const decodedTag = decodeURIComponent(tag);
  const posts = getPosts({
    tag: decodedTag,
    locale,
  });

  if (!posts) {
    return {};
  }

  const baseUrl = getBaseURL();
  const canonicalUrl = getLocalizedUrl(
    locale,
    `/tags/${encodeURIComponent(decodedTag)}`,
    baseUrl,
  );

  return {
    metadataBase: new URL(baseUrl),
    title: decodedTag,
    description: t("tagMetadataDescription", { tag: decodedTag }),
    keywords: posts.map((post) => post.tags?.join(", ")).join(", "),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: decodedTag,
      type: "article",
      images: posts.map((post) => ({
        url: getOgImageUrl(post.title, locale, baseUrl),
      })),
      authors: ["Abdul Hamid Achik"],
      url: canonicalUrl,
    },
  };
}

export function generateStaticParams() {
  const localeTagCache = allPosts.reduce(
    (cache, post) => {
      if (post.locale && post.tags) {
        if (!cache[post.locale]) {
          cache[post.locale] = [];
        }

        cache[post.locale].push(...post.tags);
      }

      return cache;
    },
    {} as Record<string, string[]>,
  );

  return Object.entries(localeTagCache).flatMap(([locale, tags]) =>
    tags.map((tag) => ({ locale, tag: encodeURIComponent(tag) })),
  );
}

export default async function TagPage({ params }: TagProps) {
  const { locale, tag } = await params;
  const isValidLocale = locales.some((cur) => cur === locale);

  if (!isValidLocale) notFound();

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Archive" });
  const posts =
    getPosts({
      tag: decodeURIComponent(tag),
      locale,
    }) ?? [];

  if (posts.length === 0) notFound();

  return (
    <div className="reading-shell py-16 sm:py-24">
      <header className="border-b border-border pb-8">
        <p className="eyebrow">
          {t("tagKicker")} / {locale.toUpperCase()}
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
          #{decodeURIComponent(tag)}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("postCount", { count: posts.length })}
        </p>
      </header>

      <div className="divide-y divide-border border-b border-border">
        {posts
          .sort((first, second) => {
            const firstDate = DateTime.fromISO(first.date || "");
            const secondDate = DateTime.fromISO(second.date || "");

            return secondDate.toMillis() - firstDate.toMillis();
          })
          .map((post) => (
            <article key={post._meta.path} className="py-7">
              <Link href={`/posts/${post.slugAsParams}`}>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] transition-colors hover:text-primary">
                  {post.title}
                </h2>
              </Link>
              <div className="mt-3 flex items-center font-mono text-[0.62rem] uppercase tracking-[0.1em] text-muted-foreground">
                {post.date && (
                  <>
                    <time dateTime={post.date}>
                      {DateTime.fromISO(post.date)
                        .setLocale(locale)
                        .toLocaleString(DateTime.DATE_MED)}
                    </time>
                    <span className="mx-2">/</span>
                  </>
                )}
                <span>{post.readingTime.text}</span>
              </div>
              {post.description && (
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {post.description}
                </p>
              )}
              {post.tags && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {post.tags.slice(0, 6).map((tag) => (
                    <Link
                      href={`/tags/${encodeURIComponent(tag)}`}
                      key={tag}
                      className="border border-border px-2 py-1 font-mono text-[0.58rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
      </div>
    </div>
  );
}
