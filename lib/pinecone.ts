import { env } from "@/env.mjs";
import { PineconeClient } from "@pinecone-database/pinecone";

export const client = new PineconeClient();

await client.init({
  apiKey: env.PINECONE_API_KEY,
  environment: env.PINECONE_ENVIRONMENT,
})

export const Index = client.Index(env.PINECONE_INDEX);
