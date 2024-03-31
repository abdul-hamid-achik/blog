import { Resolvers } from "@/.generated/graphql";
import { env } from "@/env.mjs";
import { chatModel, openai as model, vectorStore } from "@/lib/ai";
import { Posts, getPage, getContent } from "@/lib/data";
import { lastfm } from "@/lib/lastfm";
import { Document } from "contentlayer/core";
import { GraphQLResolveInfo } from 'graphql';
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ConversationalRetrievalQAChain, VectorDBQAChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { HumanMessage, SystemMessage } from 'langchain/schema';
import { UpstashRedisChatMessageHistory } from "langchain/stores/message/upstash_redis";
import { ChainTool } from "langchain/tools";
import { countBy, groupBy, map } from "lodash";
import { v4 as uuid } from 'uuid';
import type { Context } from './context';


const upstashRedisConfig = {
  url: env.KV_REST_API_URL,
  token: env.KV_REST_API_TOKEN
};

const chatHistoryConfig = {
  sessionId: uuid(),
  sessionTTL: 300,
  config: upstashRedisConfig,
};

const memory = new BufferMemory({
  chatHistory: new UpstashRedisChatMessageHistory(chatHistoryConfig),
});

const conversationalChain = ConversationalRetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
  memory,
  verbose: true,
  returnSourceDocuments: true
});

const vectorDBChain = VectorDBQAChain.fromLLM(model, vectorStore, {
  returnSourceDocuments: true,
  verbose: true,
});

const conversationalTool = new ChainTool({
  name: "Conversation",
  description: "This is a conversational tool you can use to remember what has been said so far",
  chain: conversationalChain
});

const vectorDBTool = new ChainTool({
  name: "Blog",
  description: "This is a db of the blog",
  chain: vectorDBChain,
});

const tools = [conversationalTool, vectorDBTool];

const executor = await initializeAgentExecutorWithOptions(tools, chatModel, {
  agentType: "openai-functions",
  verbose: true,
});

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

const resolvers: Resolvers = {
  Mutation: {
    async chat(root, { input }, context: Context, info: GraphQLResolveInfo) {
      const { history, message } = input
      const result = await executor.call({
        input: message,
        messages: [
          new HumanMessage(message),
          ...history.map(msg => new SystemMessage(msg))
        ]
      });
      const responseMessage = result.output;
      const updatedHistory = [...history, message, responseMessage];

      return {
        message: responseMessage,
        history: updatedHistory,
      };
    }
  },
  Query: {
    posts(root, args, context, info: GraphQLResolveInfo) {
      const { locale } = context
      return getContent([], 'Post', locale)
    },

    paintings(root, args, context: Context, info: GraphQLResolveInfo) {
      const { locale } = context;
      return getContent([], 'Paint', locale)
    },

    pages(root, args, context: Context, info: GraphQLResolveInfo) {
      const { locale } = context
      return getContent([], 'Page', locale)
    },

    content(root, args, context: Context, info: GraphQLResolveInfo) {
      const { locale } = context
      return getContent([], undefined, locale)
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
      const foundContent = await vectorStore.similaritySearch(query, k!);
      const ids = [...new Set(foundContent.map(result => result.metadata._id))] as string[];
      const results = getContent(ids)
      const count = results.length
      return {
        results,
        count
      };
    },

    async answer(root, { question, k = 5 }, context: Context, info: GraphQLResolveInfo) {
      const aboutPage = getPage({ slug: "about", locale: context.locale });
      const response = await conversationalChain.call({ question, chat_history: [] });
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

    async topArtists() {
      return await lastfm.user.getTopArtists({ username: env.LASTFM_USERNAME })
        .then(response => response.artists.map(artist => ({
          rank: artist.rank,
          name: artist.name,
          scrobbles: artist.scrobbles,
          url: artist.url,
        })));
    },

    async topTracks() {
      return await lastfm.user.getTopTracks({ username: env.LASTFM_USERNAME })
        .then(response => response.tracks.map(track => ({
          rank: track.rank,
          name: track.name,
          stats: {
            duration: track.stats.duration,
            userPlayCount: track.stats.userPlayCount,
          },
          artist: {
            name: track.artist.name,
            url: track.artist.url,
          },
          url: track.url,
        })));
    },

    async topTags() {
      return await lastfm.user.getTopTags({ username: env.LASTFM_USERNAME }).then(response => response.tags);
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
