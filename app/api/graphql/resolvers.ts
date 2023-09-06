/* eslint-disable import/no-anonymous-default-export */
import { allPosts } from "@/.contentlayer/generated"
import { countBy, groupBy, map } from "lodash"

type Posts = typeof allPosts

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
  return allPosts.filter(post => post.locale === locale)
}

export default {
  Query: {
    allPosts: (_: any, __: any, { locale }) => getPostsForLocale(locale),

    postsOverTime(_: any, __: any, { locale }) {
      const posts = getPostsForLocale(locale)
      const groupedPosts = groupByMonth(posts)
      return map(groupedPosts, (posts, month) => ({
        month,
        count: posts.length,
      }))
    },

    readingTimeDistribution: (_: any, __: any, { locale }: CustomContext) => {
      const posts = getPostsForLocale(locale)
      const distribution = categorizeReadingTime(posts)
      return map(distribution, (count, category) => ({
        category,
        count,
      }))
    },
  },
}
