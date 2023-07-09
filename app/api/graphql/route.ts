import { ApolloServer } from "@apollo/server"
import { startServerAndCreateNextHandler } from "@as-integrations/next"
import { NextRequest } from "next/server"
import resolvers from "./resolvers"
import typeDefs from "./typeDefs"

const server = new ApolloServer({
  resolvers,
  typeDefs,
  allowBatchedHttpRequests: true,
})

const options = {
  context: async (req: NextRequest) => ({ req }),
}

const handler = startServerAndCreateNextHandler<NextRequest>(server, options)

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  return handler(request)
}

export async function POST(request: NextRequest) {
  return handler(request)
}
