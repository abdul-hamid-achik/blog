/* eslint-disable import/no-anonymous-default-export */
import { Page, Painting, Post, allPages, allPaintings, allPosts } from "@/.contentlayer/generated";
import { openai as model, vectorStore } from "@/lib/ai";
import { VectorDBQAChain } from "langchain/chains";
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

function getContent(ids: string[]) {
  const everything = [...allPages, ...allPaintings, ...allPosts];
  const contentById = new Map(everything.map(item => [item._id, item]));
  return ids.map(id => contentById.get(id));
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

    async search(_root: any, { query, k = 3 }: { query: string; k: number; }, context: Context, _info: any) {
      const foundContent = await vectorStore.similaritySearch(query, k);
      const ids = foundContent.map(result => result.metadata._id)
      const results = getContent(ids)
      const count = results.length

      return {
        results,
        count
      };
    },

    async answer(_root: any, { question, k = 3 }: { question: string; k: number }, context: Context, _info: any) {
      const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
        k,
        returnSourceDocuments: true,
      });
      const response = await chain.call({ query: question });
      const ids = response.sourceDocuments.map((doc: any) => doc.metadata._id);
      const results = getContent(ids)
      const count = results.length
      return {
        question,
        answer: response.text,
        results,
        count
      };
    },
  },

  SearchResult: {
    __resolveType(obj: Post | Painting | Page | any) {
      if (!obj?.type) return null

      return obj.type;
    },
  },
}
