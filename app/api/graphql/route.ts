import { ApolloServer } from "@apollo/server"
import { buildSubgraphSchema } from '@apollo/subgraph'
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
    resolvers: resolvers as GraphQLResolverMap<unknown>
  }),
  allowBatchedHttpRequests: true,
  introspection: true,
});

const options = {
  context: async (req: NextRequest) => {
    const locale = req.headers.get('locale') || 'en';

    return ({ req, locale })
  },
}

const handler = startServerAndCreateNextHandler<NextRequest, Context>(server, options)

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function OPTIONS(_request: Request) {
  const response = new Response(undefined, { status: status.OK })
  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Access-Control-Allow-Credentials", "true")
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  )
  response.headers.set(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  )
  return response
}

export async function GET(request: NextRequest) {
  const response = await handler(request)
  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Access-Control-Allow-Credentials", "true")
  return response
}

export async function POST(request: NextRequest) {
  const response = await handler(request)
  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Access-Control-Allow-Credentials", "true")
  return response
}
