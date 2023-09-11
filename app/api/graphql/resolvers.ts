/* eslint-disable import/no-anonymous-default-export */
import { allPaintings, allPosts } from "@/.contentlayer/generated";
import { countBy, groupBy, map } from "lodash";


function getPaintingsForLocale(locale: string) {
  return allPaintings.filter((painting) => painting.locale === locale);
}

type Paintings = typeof allPaintings;

type Posts = typeof allPosts
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
  },
}
