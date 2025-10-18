import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginUsageReportingDisabled } from '@apollo/server/plugin/disabled';
import { ApolloServerPluginInlineTrace } from "@apollo/server/plugin/inlineTrace";
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default";

import { env } from "@/env.mjs";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { GraphQLResolverMap } from "@apollo/subgraph/dist/schema-helper";
import { KeyvAdapter } from '@apollo/utils.keyvadapter';
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import KeyvRedis from '@keyv/redis';
import status from "http-status";
import Keyv from 'keyv';
import { NextRequest } from "next/server";
import type { Context } from './context';
import resolvers from "./resolvers";
import typeDefs from "./typeDefs";
import { isProduction } from '@/lib/utils';

const schema = buildSubgraphSchema({
  typeDefs,
  resolvers: resolvers as GraphQLResolverMap<unknown>
})

// The store is being created here to connect to the Redis database.
// If the URL includes 'vercel-storage', it means we are in a production environment and we need to use 'rediss://' instead of 'redis://'.
// Otherwise, we use the local URL as it is.
const store = new KeyvRedis(env.KV_URL.includes('vercel-storage') ? env.KV_URL.replace('redis://', 'rediss://') : env.KV_URL);
const keyv = new Keyv<string>({ store, namespace: 'api' })
const cache = new KeyvAdapter(keyv as any)

const server = new ApolloServer<Context>({
  schema,
  allowBatchedHttpRequests: true,
  introspection: true,
  cache,
  plugins: [
    ApolloServerPluginUsageReportingDisabled(),
    ApolloServerPluginInlineTrace({
      includeErrors: { unmodified: true },
    }),
    isProduction
      ? ApolloServerPluginLandingPageProductionDefault({
        graphRef: `abdulachik-blog@current`,
        footer: false,
      })
      : ApolloServerPluginLandingPageLocalDefault({
        footer: false
      }),
  ],
}) as any

const options = {
  context: async (req: NextRequest) => {
    const locale = req.headers.get("locale") || "en"

    return { req, locale }
  },
}

const handler = startServerAndCreateNextHandler<NextRequest, Context>(
  server,
  options
)

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function OPTIONS(_request: Request) {
  return new Response(undefined, { status: status.OK })
}

export async function GET(request: NextRequest) {
  return await handler(request)
}

export async function POST(request: NextRequest) {
  return await handler(request)
}
