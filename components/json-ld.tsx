import { getLocalizedUrl } from "@/lib/site-url";
import { getBaseURL } from "@/lib/utils";

interface ArticleJsonLdProps {
  title: string;
  description?: string | null;
  date?: string | null;
  image?: string | null;
  slug: string;
  locale: string;
  tags?: string[];
  type?: "posts" | "paintings";
}

export function ArticleJsonLd({
  title,
  description,
  date,
  image,
  slug,
  locale,
  tags,
  type = "posts",
}: ArticleJsonLdProps) {
  const baseUrl = getBaseURL();
  const url = getLocalizedUrl(locale, `/${type}/${slug}`, baseUrl);
  const imageUrl = image ? new URL(image, `${baseUrl}/`).toString() : undefined;

  const jsonLd =
    type === "paintings"
      ? {
          "@context": "https://schema.org",
          "@type": "VisualArtwork",
          name: title,
          description: description || undefined,
          url,
          inLanguage: locale,
          image: imageUrl,
          keywords: tags?.join(", "),
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": url,
          },
        }
      : {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          description: description || undefined,
          datePublished: date || undefined,
          dateModified: date || undefined,
          author: {
            "@type": "Person",
            name: "Abdul Hamid Achik",
            url: getLocalizedUrl(locale, "/about", baseUrl),
          },
          publisher: {
            "@type": "Person",
            name: "Abdul Hamid Achik",
          },
          url,
          inLanguage: locale,
          image: imageUrl,
          keywords: tags?.join(", "),
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": url,
          },
        };

  const jsonString = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}

export function WebSiteJsonLd({
  description,
  locale,
}: {
  description: string;
  locale: string;
}) {
  const baseUrl = getBaseURL();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Abdul Hamid",
    description,
    url: getLocalizedUrl(locale, "/", baseUrl),
    inLanguage: locale,
    author: {
      "@type": "Person",
      name: "Abdul Hamid Achik",
      url: getLocalizedUrl(locale, "/about", baseUrl),
    },
  };

  const jsonString = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}
