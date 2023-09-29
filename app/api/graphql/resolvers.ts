import { allDocuments, allPages, allPaintings, allPosts } from "@/.contentlayer/generated";
import { Content, Resolvers } from "@/.generated/graphql";
import { openai as model, vectorStore } from "@/lib/ai";
import { Document } from "contentlayer/core";
import { GraphQLResolveInfo } from 'graphql';
import { VectorDBQAChain } from "langchain/chains";
import { countBy, groupBy, map } from "lodash";
import type { Context } from './context.ts';

type Paintings = typeof allPaintings;
type Posts = typeof allPosts
type Pages = typeof allPages


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

function getContent(ids?: string[], type?: Content['type'], locale?: string) {
  let everything = allDocuments;

  if (type) {
    everything = everything.filter(document => document.type === type);
  }

  if (locale) {
    everything = everything.filter(document => document.locale === locale);
  }

  if (!ids || ids.length === 0) {
    return everything;
  }

  return everything.filter(item => ids.includes(item._id));
}

const resolvers: Resolvers = {
  Query: {
    allPosts(root, args, context, info: GraphQLResolveInfo) {
      const { locale } = context
      return getContent([], 'Post', locale)
    },

    allPaintings(root, args, context: Context, info: GraphQLResolveInfo) {
      const { locale } = context;
      return getContent([], 'Paint', locale)
    },

    allPages(root, args, context: Context, info: GraphQLResolveInfo) {
      const { locale } = context
      return getContent([], 'Page', locale)
    },

    postsOverTime(root, args, context: Context, info: GraphQLResolveInfo) {
      const { locale } = context
      const posts = getContent([], "Post", locale)
      const groupedPosts = groupByMonth(posts as Posts)
      return map(groupedPosts, (posts, month) => ({
        month,
        count: posts.length,
      }))
    },

    readingTimeDistribution(
      root,
      args,
      context: Context,
      info: GraphQLResolveInfo
    ) {
      const { locale } = context
      const posts = getContent([], "Post", locale)
      const distribution = categorizeReadingTime(posts as Posts)
      return map(distribution, (count, category) => ({
        category,
        count,
      }))
    },

    async search(root, { query, k = 5 }, context: Context, info: GraphQLResolveInfo) {
      console.log(`search query: ${query}, k: ${k}`);
      const foundContent = await vectorStore.similaritySearch(query, k!);
      console.log(`found content: ${JSON.stringify(foundContent)}`);
      const ids = [...new Set(foundContent.map(result => result.metadata._id))] as string[];
      console.log(`ids: ${JSON.stringify(ids)}`);
      const results = getContent(ids)
      console.log(`results: ${JSON.stringify(results)}`);
      const count = results.length
      console.log(`count: ${count}`);
      return {
        results,
        count
      };
    },

    async answer(root, { question, k = 5 }, context: Context, info: GraphQLResolveInfo) {
      const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
        k: k!,
        returnSourceDocuments: true,
        verbose: true,
      });
      const response = await chain.call({ query: question });
      const ids = [...new Set(response.sourceDocuments.map((doc: Document) => doc.metadata._id as string))] as string[];
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

  Content: {
    __resolveType(obj) {
      if (obj?.type === 'Page' || obj?.type === 'Post' || obj?.type === 'Painting') {
        return obj.type;
      }
      return null;
    },
  },
}

export default resolvers
