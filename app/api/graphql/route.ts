import { ApolloServer, HeaderMap } from "@apollo/server";
import {
  ApolloServerPluginInlineTraceDisabled,
  ApolloServerPluginUsageReportingDisabled,
} from "@apollo/server/plugin/disabled";
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default";

import { env } from "@/env.mjs";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { GraphQLResolverMap } from "@apollo/subgraph/dist/schema-helper";
import { KeyvAdapter } from '@apollo/utils.keyvadapter';
import KeyvRedis from '@keyv/redis';
import status from "http-status";
import Keyv from 'keyv';
import { NextRequest } from "next/server";
import type { Context } from './context';
import resolvers from "./resolvers";
import typeDefs from "./typeDefs";
import { isProduction } from '@/lib/utils';
import { getAuthenticatedUser } from '@/lib/auth';

const schema = buildSubgraphSchema({
  typeDefs,
  resolvers: resolvers as GraphQLResolverMap<unknown>
})

const MAX_BATCH_SIZE = 5
const shouldUseRedisCache = isProduction && process.env.VERCEL === "1"

let cache: KeyvAdapter | undefined;
let serverPromise: Promise<ApolloServer<Context>> | undefined;

function getCache() {
  if (!shouldUseRedisCache) {
    return undefined
  }

  if (!cache) {
    // Delay the Redis connection until the route receives traffic, and only
    // enable it in the deployed runtime. Local `next start` should stay
    // functional even if the hosted Redis endpoint is unavailable.
    const store = new KeyvRedis(
      env.KV_URL.includes('vercel-storage')
        ? env.KV_URL.replace('redis://', 'rediss://')
        : env.KV_URL
    );
    const keyv = new Keyv<string>({ store, namespace: 'api' });
    cache = new KeyvAdapter(keyv as any);
  }

  return cache
}

const options = {
  context: async (req: NextRequest) => {
    const locale = req.headers.get("locale") || "en"
    const user = await getAuthenticatedUser()

    return Promise.resolve({ req, locale, user })
  },
}

function createServer() {
  const server = new ApolloServer<Context>({
    schema,
    allowBatchedHttpRequests: true,
    introspection: !isProduction,
    cache: getCache(),
    plugins: [
      ApolloServerPluginUsageReportingDisabled(),
      ApolloServerPluginInlineTraceDisabled(),
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

  server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests()

  return server
}

function getServer() {
  if (!serverPromise) {
    serverPromise = Promise.resolve(createServer())
  }

  return serverPromise
}

async function getRequestBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? ""

  return contentType.startsWith("application/json")
    ? await request.json()
    : await request.text()
}

function getRequestHeaders(request: NextRequest) {
  const headers = new HeaderMap()
  request.headers.forEach((value, key) => {
    headers.set(key, value)
  })
  return headers
}

async function executeGraphQLRequest(request: NextRequest) {
  const server = await getServer()
  const httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
    context: () => options.context(request),
    httpGraphQLRequest: {
      body: await getRequestBody(request),
      headers: getRequestHeaders(request),
      method: request.method || "POST",
      search: request.nextUrl.search,
    },
  })

  const headers: Record<string, string> = {}
  for (const [key, value] of httpGraphQLResponse.headers) {
    headers[key] = value
  }

  return new Response(
    httpGraphQLResponse.body.kind === "complete"
      ? httpGraphQLResponse.body.string
      : new ReadableStream({
          async pull(controller) {
            if (httpGraphQLResponse.body.kind !== "chunked") {
              controller.close()
              return
            }

            const { value, done } = await httpGraphQLResponse.body.asyncIterator.next()
            if (done) {
              controller.close()
              return
            }

            controller.enqueue(value)
          },
        }),
    {
      headers,
      status: httpGraphQLResponse.status || status.OK,
    }
  )
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export function OPTIONS(_request: Request) {
  return new Response(undefined, { status: status.OK })
}

export async function GET(request: NextRequest) {
  return await executeGraphQLRequest(request)
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? ""
  const mediaType = contentType.split(";")[0].trim().toLowerCase()
  const allowedMediaTypes = new Set([
    "application/json",
    "application/graphql+json",
    "application/graphql-response+json",
  ])

  if (!allowedMediaTypes.has(mediaType)) {
    return await executeGraphQLRequest(request)
  }

  const clonedRequest = request.clone()
  let requestBody: unknown

  try {
    requestBody = await clonedRequest.json()
  } catch (error) {
    const requestId = request.headers.get("x-request-id") ?? "unknown"
    const errorMessage = (
      error instanceof Error ? error.message : "unknown error"
    ).replace(/[\r\n]+/g, " ") // Prevent multi-line log injection.
    console.warn(
      `Failed to parse GraphQL request body for batch validation (${errorMessage}); forwarding to handler. requestId=${requestId}`
    )
    return await executeGraphQLRequest(request)
  }

  if (Array.isArray(requestBody) && requestBody.length > MAX_BATCH_SIZE) {
    return Response.json(
      {
        errors: [
          {
            message: `Batch size limit exceeded. Received ${requestBody.length} operations, maximum allowed is ${MAX_BATCH_SIZE}.`,
          },
        ],
      },
      { status: status.BAD_REQUEST }
    )
  }

  return await executeGraphQLRequest(request)
}
