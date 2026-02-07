import { getBaseURL } from "@/lib/utils"

interface ArticleJsonLdProps {
  title: string
  description?: string | null
  date?: string | null
  image?: string | null
  slug: string
  locale: string
  tags?: string[]
}

export function ArticleJsonLd({
  title,
  description,
  date,
  image,
  slug,
  locale,
  tags,
}: ArticleJsonLdProps) {
  const baseUrl = getBaseURL()
  const url = `${baseUrl}/${locale}/posts/${slug}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: description || undefined,
    datePublished: date || undefined,
    dateModified: date || undefined,
    author: {
      "@type": "Person",
      name: "Abdul Hamid Achik",
      url: `${baseUrl}/about`,
    },
    publisher: {
      "@type": "Person",
      name: "Abdul Hamid Achik",
    },
    url,
    inLanguage: locale,
    image: image ? `${baseUrl}${image}` : undefined,
    keywords: tags?.join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function WebSiteJsonLd() {
  const baseUrl = getBaseURL()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Abdul Hamid",
    description: "A Lacanian full-stack developer — arts, culture, and technology.",
    url: baseUrl,
    author: {
      "@type": "Person",
      name: "Abdul Hamid Achik",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/en?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
