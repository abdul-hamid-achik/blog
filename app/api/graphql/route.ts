import { ApolloServer } from "@apollo/server"
import { startServerAndCreateNextHandler } from "@as-integrations/next"
import status from 'http-status'
import { NextRequest } from "next/server"
import resolvers from "./resolvers"
import typeDefs from "./typeDefs"

const server = new ApolloServer({
  resolvers,
  typeDefs,
  allowBatchedHttpRequests: true,
  introspection: true,
})

const options = {
  context: async (req: NextRequest) => ({ req }),
}

const handler = startServerAndCreateNextHandler<NextRequest>(server, options)

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function OPTIONS(_request: Request) {
  const response = new Response(undefined, { status: status.OK });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );
  return response;
}


export async function GET(request: NextRequest) {
  const response = await handler(request)
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response
}

export async function POST(request: NextRequest) {
  const response = await handler(request)
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response
}
