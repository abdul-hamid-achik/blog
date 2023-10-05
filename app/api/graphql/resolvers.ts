import { allDocuments, allPages, allPaintings, allPosts } from "@/.contentlayer/generated";
import { Content, Resolvers } from "@/.generated/graphql";
import { env } from "@/env.mjs";
import { openai as model, vectorStore } from "@/lib/ai";
import { lastfm } from "@/lib/lastfm";
import { Document } from "contentlayer/core";
import { GraphQLResolveInfo } from 'graphql';
import { ConversationalRetrievalQAChain, VectorDBQAChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { UpstashRedisChatMessageHistory } from "langchain/stores/message/upstash_redis";
import { countBy, groupBy, map } from "lodash";
import { v4 as uuid } from 'uuid';
import type { Context } from './context';

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
  Mutation: {
    async chat(root, { input }, context: Context, info: GraphQLResolveInfo) {
      const { history, message } = input
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

      const chain = ConversationalRetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
        memory,
        verbose: true,
        returnSourceDocuments: true
      });

      const response = await chain.call({ chat_history: history, question: message });

      return {
        message: response.text,
        history: [...history, message, response.text],
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
      const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
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
