import { Link } from "@/navigation"
import { getPosts } from "@/lib/data"
import { DateTime } from "luxon"
import { useTranslations } from "next-intl"

interface RelatedPostsProps {
  currentSlug: string
  locale: string
  tags?: string[]
}

export default function RelatedPosts({ currentSlug, locale, tags }: RelatedPostsProps) {
  const t = useTranslations()
  if (!tags || tags.length === 0) return null

  const allPosts = getPosts({ locale, public: true })
  if (!allPosts) return null

  const related = allPosts
    .filter((post) => post.slugAsParams !== currentSlug)
    .map((post) => {
      const overlap = post.tags?.filter((tag) => tags.includes(tag)).length || 0
      return { post, overlap }
    })
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3)

  if (related.length === 0) return null

  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-lg font-semibold mb-4">{t("Related Posts")}</h2>
      <div className="space-y-3">
        {related.map(({ post }) => (
          <article key={post._meta.path}>
            <Link href={`/posts/${post.slugAsParams}`} className="no-underline">
              <h3 className="text-base font-medium hover:underline">{post.title}</h3>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {post.date && (
                <time dateTime={post.date}>
                  {DateTime.fromISO(post.date).toRelative()}
                </time>
              )}
              <span>&middot;</span>
              <span>{post.readingTime.text}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
