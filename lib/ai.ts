import { env } from "@/env.mjs";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";

export const openai = new OpenAI({
  modelName: "gpt-4-32k",
  openAIApiKey: env.OPEN_AI_API_KEY,
});

export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: env.OPEN_AI_API_KEY
});
