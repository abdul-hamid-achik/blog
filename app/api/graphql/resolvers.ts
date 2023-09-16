/* eslint-disable import/no-anonymous-default-export */
import { Page, Painting, Post, allPaintings, allPosts } from "@/.contentlayer/generated";
import { client as esClient } from '@/lib/elastic';
import { countBy, groupBy, map } from "lodash";

type Paintings = typeof allPaintings;

type Posts = typeof allPosts
type Context = {
  locale: string
}

function getPaintingsForLocale(locale: string) {
  return allPaintings.filter((painting) => painting.locale === locale);
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

function getPostsForLocale(locale: string) {
  return allPosts.filter((post) => post.locale === locale)
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
      const { locale } = context;

      const response = await esClient.search<Post | Painting | Page>({
        index: "search-blog",
        q: query
      })

      const results = response.hits.hits.map(hit => hit._source).filter(result => result?.type !== 'Page').map(result => ({
        ...result,
        _id: result?._raw.sourceFilePath
      }))

      return results;
    },
  },
  SearchResult: {
    __resolveType(obj: Post | Painting | any) {
      if (!obj?.type) return null

      return obj.type;
    },
  },
}
