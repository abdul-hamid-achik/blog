import { allPages, allPaintings, allPosts } from 'content-collections';
import { getBaseURL } from '@/lib/utils';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseURL()
  const postsSitemap = allPosts.map(post => ({
    url: `${baseUrl}/${post.locale}${post.slug}`,
    lastModified: new Date(),
    changeFrequency: 'always' as const,
    priority: 1.0,
  }));

  const pagesSitemap = allPages.map(page => ({
    url: `${baseUrl}/${page.locale}${page.slug.replace('/pages', '')}`,
    lastModified: new Date(),
    changeFrequency: 'always' as const,
    priority: 1.0,
  }));

  const paintingsSitemap = allPaintings.map(painting => ({
    url: `${baseUrl}/${painting.locale}${painting.slug}`,
    lastModified: new Date(),
    changeFrequency: "always" as const,
    priority: 1.0
  }))

  return [
    ...pagesSitemap,
    ...postsSitemap,
    ...paintingsSitemap
  ]
}
