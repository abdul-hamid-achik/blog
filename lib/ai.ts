import { env } from "@/env.mjs";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { ElasticVectorSearch } from "langchain/vectorstores/elasticsearch";
import { client } from "./elastic";

export const openai = new OpenAI({
  modelName: "gpt-4",
  openAIApiKey: env.OPEN_AI_API_KEY,
  temperature: 0.9
});

export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: env.OPEN_AI_API_KEY
});


export const vectorStore = new ElasticVectorSearch(embeddings, {
  client,
  indexName: "search-blog",
});
