/* eslint-disable import/no-anonymous-default-export */
import { Page, Painting, Post, allPages, allPaintings, allPosts } from "@/.contentlayer/generated";
import { vectorStore } from "@/lib/ai";
import { countBy, groupBy, map } from "lodash";

type Paintings = typeof allPaintings;
type Posts = typeof allPosts
type Pages = typeof allPages

type Context = {
  locale: string
}

function groupByMonth(posts: Posts) {
  return groupBy(posts, (post) => {
    const date = new Date(post.date)
    return `${date.getFullYear()}-${date.getMonth() + 1}`
  })
}

function categorizeReadingTime(posts: Posts) {
  return countBy(posts, (post) => {
    const time = post.readingTime.minutes
    if (time < 2) return "0-2 minutes"
    if (time < 5) return "2-5 minutes"
    if (time < 10) return "5-10 minutes"
    return "10+ minutes"
  })
}

function getPaintingsForLocale(locale: string) {
  return allPaintings.filter((painting) => painting.locale === locale);
}

function getPostsForLocale(locale: string) {
  return allPosts.filter((post) => post.locale === locale)
}

function getPagesForLocale(locale: string) {
  return allPages.filter((page) => page.locale === locale)
}

export default {
  Query: {
    allPosts(_root: any, _args: any, context: Context, _info: any) {
      const { locale } = context
      return getPostsForLocale(locale)
    },

    allPaintings(_root: any, _args: any, context: Context, _info: any) {
      const { locale } = context;
      return getPaintingsForLocale(locale);
    },

    allPages(_root: any, _args: any, context: Context, _info: any) {
      const { locale } = context
      return getPagesForLocale(locale)
    },

    postsOverTime(_root: any, _args: any, context: Context, _info: any) {
      const { locale } = context
      const posts = getPostsForLocale(locale)
      const groupedPosts = groupByMonth(posts)
      return map(groupedPosts, (posts, month) => ({
        month,
        count: posts.length,
      }))
    },

    readingTimeDistribution(
      _root: any,
      _args: any,
      context: Context,
      _info: any
    ) {
      const { locale } = context
      const posts = getPostsForLocale(locale)
      const distribution = categorizeReadingTime(posts)
      return map(distribution, (count, category) => ({
        category,
        count,
      }))
    },

    async search(_root: any, { query }: { query: string }, context: Context, _info: any) {
      const content = [...allPaintings, ...allPosts, ...allPages]
      const foundContent = await vectorStore.similaritySearch(query, 1);
      const ids = foundContent.map(result => result.metadata._id)
      const results = content.filter(content => ids.includes(content._id))

      return results;
    },
  },
  SearchResult: {
    __resolveType(obj: Post | Painting | Page | any) {
      if (!obj?.type) return null

      return obj.type;
    },
  },
}
