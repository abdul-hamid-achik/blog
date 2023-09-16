import { allPaintings } from "@/.contentlayer/generated"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { getBaseURL } from "@/lib/utils"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Page({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const baseUrl = getBaseURL()

  return (
    <div className="prose dark:prose-invert mt-4">
      {allPaintings
        .filter((painting) => painting.locale === locale)
        .map((painting) => (
          <article key={painting._id}>
            <Link href={`${baseUrl}/${locale}${painting.slug}`}>
              <h2 className="mb-0">{painting.title}</h2>
            </Link>
            <div className="flex items-center">
              <p className="text-sm">{painting.author}</p>
              <span className="mx-2 my-0">•</span>
              <p className="text-sm">{painting.country}</p>
              <span className="mx-2 my-0">•</span>
              <p className="text-sm">
                {painting.year}
              </p>
              <span className="mx-2 my-0">•</span>
              <p className="text-sm">{painting.readingTime.text}</p>
            </div>
            {painting.description && <p className="m-0">{painting.description}</p>}
            {painting.tags && (
              <Collapsible>
                <CollapsibleTrigger>{painting.tags.length} tags</CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="my-4 flex flex-wrap">
                    {painting.tags.map((tag) => (
                      <Link
                        href={`${baseUrl}/${locale}/tags/${tag}`}
                        key={tag}
                        className="mr-2 text-sm"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            <hr className="my-4" />
          </article>
        ))}
    </div>
  )
}
