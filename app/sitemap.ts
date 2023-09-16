import { allPages, allPaintings, allPosts } from '@/.contentlayer/generated';
import { getBaseURL } from '@/lib/utils';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseURL()
  const postsSitemap = allPosts.map(post => ({
    url: `${baseUrl}/${post.locale}${post.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const pagesSitemap = allPages.map(page => ({
    url: `${baseUrl}/${page.locale}${page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const paintingsSitemap = allPaintings.map(painting => ({
    url: `${baseUrl}/${painting.locale}${painting.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8
  }))

  return [
   ...pagesSitemap,
   ...postsSitemap,
   ...paintingsSitemap
  ]
}
