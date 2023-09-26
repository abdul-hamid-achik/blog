import { allDocuments, allPages, allPaintings, allPosts } from "@/.contentlayer/generated";
import { Content, Resolvers } from "@/.generated/graphql";
import { openai as model, vectorStore } from "@/lib/ai";
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
  const everything = allDocuments
    .filter(document => type ? document.type === type : true)
    .filter(document => locale ? document.locale === locale : true);

  const contentById = new Map(everything.map(item => [item._id, item]));

  if (!ids || ids.length === 0) return Object.values(contentById);

  return ids.map(id => contentById.get(id));
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
      const groupedPosts = groupByMonth(posts)
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
      const distribution = categorizeReadingTime(posts)
      return map(distribution, (count, category) => ({
        category,
        count,
      }))
    },

    async search(root, { query, k = 3 }, context: Context, info: GraphQLResolveInfo) {
      const foundContent = await vectorStore.similaritySearch(query, k!);
      const ids = foundContent.map(result => result.metadata._id)
      const results = getContent(ids)
      const count = results.length
      return {
        results,
        count
      };
    },

    async answer(root, { question, k = 3 }, context: Context, info: GraphQLResolveInfo) {
      const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
        k: k!,
        returnSourceDocuments: true,
        verbose: true,
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
