import { ApolloServer } from "@apollo/server"
import { ApolloServerPluginInlineTrace } from "@apollo/server/plugin/inlineTrace"
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default"
import { buildSubgraphSchema } from "@apollo/subgraph"
import { GraphQLResolverMap } from "@apollo/subgraph/dist/schema-helper"
import { startServerAndCreateNextHandler } from "@as-integrations/next"
import status from "http-status"
import { NextRequest } from "next/server"
import resolvers from "./resolvers"
import typeDefs from "./typeDefs"

type Context = {
  locale: string
}

const server = new ApolloServer<Context>({
  schema: buildSubgraphSchema({
    typeDefs,
    resolvers: resolvers as GraphQLResolverMap<unknown>,
  }),
  allowBatchedHttpRequests: true,
  introspection: true,
  plugins: [
    ApolloServerPluginInlineTrace({
      includeErrors: { unmodified: true },
    }),
    process.env.NODE_ENV === "production"
      ? ApolloServerPluginLandingPageProductionDefault({
          graphRef: "abdulachik-blog@current",
          footer: false,
        })
      : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
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
  const response = new Response(undefined, { status: status.OK })
  return response
}

export async function GET(request: NextRequest) {
  const response = await handler(request)
  return response
}

export async function POST(request: NextRequest) {
  const response = await handler(request)
  return response
}
