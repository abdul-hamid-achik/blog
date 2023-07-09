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

export default {
  Query: {
    allPosts: () => allPosts,

    postsOverTime: () => {
      const groupedPosts = groupByMonth(allPosts)
      return map(groupedPosts, (posts, month) => ({
        month,
        count: posts.length,
      }))
    },

    readingTimeDistribution: () => {
      const distribution = categorizeReadingTime(allPosts)
      return map(distribution, (count, category) => ({
        category,
        count,
      }))
    },
  },
}
