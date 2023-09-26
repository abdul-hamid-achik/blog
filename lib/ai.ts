import { env } from "@/env.mjs";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { Index } from "./pinecone";

export const openai = new OpenAI({
  modelName: "gpt-4",
  openAIApiKey: env.OPEN_AI_API_KEY,
  temperature: 0.9
});

export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: env.OPEN_AI_API_KEY
});

export const vectorStore = new PineconeStore(embeddings, {
  pineconeIndex: Index as any,
  maxRetries: 1,
  maxConcurrency: 1
});
