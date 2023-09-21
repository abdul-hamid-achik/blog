import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginUsageReportingDisabled } from '@apollo/server/plugin/disabled';
import { ApolloServerPluginInlineTrace } from "@apollo/server/plugin/inlineTrace";
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default";

import { buildSubgraphSchema } from "@apollo/subgraph";
import { GraphQLResolverMap } from "@apollo/subgraph/dist/schema-helper";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import status from "http-status";
import { NextRequest } from "next/server";
import type { Context } from './context';
import resolvers from "./resolvers";
import typeDefs from "./typeDefs";

const schema = buildSubgraphSchema({
  typeDefs,
  resolvers: resolvers as GraphQLResolverMap<unknown>
})

const server = new ApolloServer<Context>({
  schema,
  allowBatchedHttpRequests: true,
  introspection: true,
  plugins: [
    ApolloServerPluginUsageReportingDisabled(),
    ApolloServerPluginInlineTrace({
      includeErrors: { unmodified: true },
    }),
    process.env.NODE_ENV === "production"
      ? ApolloServerPluginLandingPageProductionDefault({
          graphRef: `abdulachik-blog@current`,
          footer: false,
        })
      : ApolloServerPluginLandingPageLocalDefault({
        footer: false
      }),
  ],
})

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
