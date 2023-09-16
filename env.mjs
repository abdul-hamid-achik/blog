import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    OPEN_AI_API_KEY: z.string().min(1).optional(),
    APOLLO_KEY: z.string(),
    APOLLO_GRAPH_REF: z.string(),
    ELASTICSEARCH_USERNAME: z.string(),
    ELASTICSEARCH_PASSWORD: z.string(),
    ELASTICSEARCH_API_KEY: z.string(),
    ELASTICSEARCH_URL: z.string(),
    ELASTICSEARCH_CLOUD_ID: z.string()
  },
  client: {},
  runtimeEnv: {
    OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY,
    APOLLO_KEY: process.env.APOLLO_KEY,
    APOLLO_GRAPH_REF: process.env.APOLLO_GRAPH_REF,
    ELASTICSEARCH_USERNAME: process.env.ELASTICSEARCH_USERNAME,
    ELASTICSEARCH_PASSWORD: process.env.ELASTICSEARCH_PASSWORD,
    ELASTICSEARCH_API_KEY: process.env.ELASTICSEARCH_API_KEY,
    ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL,
    ELASTICSEARCH_CLOUD_ID: process.env.ELASTICSEARCH_CLOUD_ID
  },
});
