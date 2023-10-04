import { env } from "@/env.mjs";
import { isProduction } from "@/lib/utils";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { PGVectorStore } from "langchain/vectorstores/pgvector";

export const openai = new OpenAI({
  modelName: "gpt-4",
  openAIApiKey: env.OPEN_AI_API_KEY,
  temperature: 0.9
});

export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: env.OPEN_AI_API_KEY
});


export const vectorStore = await PGVectorStore.initialize(embeddings, {
  postgresConnectionOptions: {
    host: env.POSTGRES_HOST,
    database: env.POSTGRES_DATABASE,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    ssl: isProduction
  },
  tableName: "documents",
  columns: {
    idColumnName: "id",
    vectorColumnName: "embedding",
    contentColumnName: "content",
    metadataColumnName: "metadata",
  },
  verbose: !isProduction
});
