import { allPages, allPaintings, allPosts } from 'content-collections';
import { getBaseURL } from '@/lib/utils';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseURL()

  const homeSitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
  ]

  const postsSitemap = allPosts.map(post => ({
    url: `${baseUrl}/${post.locale}/posts${post.slug}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const pagesSitemap = allPages.map(page => ({
    url: `${baseUrl}/${page.locale}${page.slug.replace('/pages', '')}`,
    lastModified: new Date(),
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }));

  const paintingsSitemap = allPaintings.map(painting => ({
    url: `${baseUrl}/${painting.locale}/paintings${painting.slug}`,
    lastModified: new Date(),
    changeFrequency: 'yearly' as const,
    priority: 0.5,
  }))

  return [
    ...homeSitemap,
    ...postsSitemap,
    ...pagesSitemap,
    ...paintingsSitemap,
  ]
}
