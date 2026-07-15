import {
  EssayArchive,
  type EssayArchiveItem,
} from "@/components/essay-archive";
import { getPosts } from "@/lib/data";
import { getLocalizedUrl, getOgImageUrl } from "@/lib/site-url";
import { getBaseURL } from "@/lib/utils";
import { locales } from "@/navigation";
import { DateTime } from "luxon";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

interface EssaysPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: EssaysPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "EssaysPage" });
  const baseUrl = getBaseURL();
  const canonicalUrl = getLocalizedUrl(locale, "/essays", baseUrl);
  const languages = Object.fromEntries(
    locales.map((candidate) => [
      candidate,
      getLocalizedUrl(candidate, "/essays", baseUrl),
    ]),
  );

  return {
    metadataBase: new URL(baseUrl),
    title: t("title"),
    description: t("description"),
    alternates: { canonical: canonicalUrl, languages },
    openGraph: {
      type: "website",
      title: t("title"),
      description: t("description"),
      url: canonicalUrl,
      images: [{ url: getOgImageUrl(t("title"), locale, baseUrl) }],
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function EssaysPage({ params }: EssaysPageProps) {
  const { locale } = await params;

  if (!locales.some((candidate) => candidate === locale)) notFound();

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "EssaysPage" });
  const posts = (getPosts({ locale, public: true }) ?? []).sort(
    (first, second) =>
      DateTime.fromISO(second.date || "").toMillis() -
      DateTime.fromISO(first.date || "").toMillis(),
  );
  const items: EssayArchiveItem[] = posts.map((post) => ({
    id: post._meta.path,
    title: post.title,
    description: post.description,
    formattedDate: post.date
      ? DateTime.fromISO(post.date)
          .setLocale(locale)
          .toLocaleString(DateTime.DATE_MED)
      : null,
    readingTime: post.readingTime.text,
    tags: post.tags ?? [],
    href: `/posts/${post.slugAsParams}`,
  }));

  return (
    <div className="site-shell border-x border-border px-5 pb-24 sm:px-8 lg:px-12">
      <header className="grid gap-8 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:py-24">
        <div>
          <p className="eyebrow">
            {t("kicker")} / {locale.toUpperCase()}
          </p>
          <h1 className="display-title mt-7 max-w-5xl text-balance">
            {t("title")}
          </h1>
        </div>
        <div className="lg:border-l lg:border-border lg:pl-6">
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("description")}
          </p>
          <p className="mt-5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-primary">
            {t("count", { count: items.length })}
          </p>
        </div>
      </header>

      <EssayArchive items={items} />
    </div>
  );
}
