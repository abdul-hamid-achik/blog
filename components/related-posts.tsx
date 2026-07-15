import { Link } from "@/navigation";
import { getPosts } from "@/lib/data";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";

interface RelatedPostsProps {
  currentSlug: string;
  locale: string;
  tags?: string[];
}

export default function RelatedPosts({
  currentSlug,
  locale,
  tags,
}: RelatedPostsProps) {
  const t = useTranslations("Article");
  if (!tags || tags.length === 0) return null;

  const allPosts = getPosts({ locale, public: true });
  if (!allPosts) return null;

  const related = allPosts
    .filter((post) => post.slugAsParams !== currentSlug)
    .map((post) => {
      const overlap =
        post.tags?.filter((tag) => tags.includes(tag)).length || 0;
      return { post, overlap };
    })
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border pt-8">
      <p className="eyebrow">{t("keepReading")}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
        {t("relatedPosts")}
      </h2>
      <div className="mt-6 divide-y divide-border border-b border-border">
        {related.map(({ post }, index) => (
          <article
            key={post._meta.path}
            className="grid gap-3 py-5 sm:grid-cols-[2rem_1fr_auto] sm:items-center"
          >
            <span className="font-mono text-[0.62rem] text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <Link href={`/posts/${post.slugAsParams}`} className="no-underline">
              <h3 className="text-base font-semibold tracking-[-0.025em] transition-colors hover:text-primary">
                {post.title}
              </h3>
            </Link>
            <div className="flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-muted-foreground">
              {post.date && (
                <time dateTime={post.date}>
                  {DateTime.fromISO(post.date)
                    .setLocale(locale)
                    .toLocaleString(DateTime.DATE_MED)}
                </time>
              )}
              <span>/</span>
              <span>{post.readingTime.text}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
