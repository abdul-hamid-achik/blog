import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    OPEN_AI_API_KEY: z.string().min(1).optional(),
    APOLLO_KEY: z.string(),
    APOLLO_GRAPH_REF: z.string(),
    KV_URL: z.string(),
    KV_REST_API_URL: z.string(),
    KV_REST_API_TOKEN: z.string(),
    KV_REST_API_READ_ONLY_TOKEN: z.string(),
    PINECONE_API_KEY: z.string(),
    PINECONE_ENVIRONMENT: z.string(),
    PINECONE_INDEX: z.string()
  },
  client: {},
  runtimeEnv: {
    OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY,
    APOLLO_KEY: process.env.APOLLO_KEY,
    APOLLO_GRAPH_REF: process.env.APOLLO_GRAPH_REF,
    KV_URL: process.env.KV_URL,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    KV_REST_API_READ_ONLY_TOKEN: process.env.KV_REST_API_READ_ONLY_TOKEN,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
    PINECONE_INDEX: process.env.PINECONE_INDEX
  },

});
