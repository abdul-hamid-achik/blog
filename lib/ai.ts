import { documents } from "@/db/schema";
import { env } from "@/env.mjs";
import { db } from "@/lib/db";
import { localizeSearchDocument } from "@/lib/search-localization";
import { isProduction } from "@/lib/utils";
import { gateway } from "@ai-sdk/gateway";
import { createOpenAI } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import { sql } from "drizzle-orm";

const CONCIERGE_PRIMARY_MODEL = "openai/gpt-5.4-nano";
const CONCIERGE_FALLBACK_MODEL = "google/gemini-3-flash";

export const conciergeModel = gateway(CONCIERGE_PRIMARY_MODEL);

interface ConciergeGatewayOptions {
  feature: string;
  user: string;
  locale?: string;
}

/**
 * Apply consistent Gateway failover and cost attribution to concierge calls.
 * Conversation caching is intentionally omitted because every response is
 * user- and history-specific.
 */
export function getConciergeProviderOptions({
  feature,
  user,
  locale,
}: ConciergeGatewayOptions) {
  return {
    gateway: {
      models: [CONCIERGE_FALLBACK_MODEL],
      user,
      tags: [
        `feature:${feature}`,
        `env:${isProduction ? "production" : "development"}`,
        ...(locale ? [`locale:${locale}`] : []),
      ],
    },
  };
}

// AI Gateway does not support embeddings, so this remains a direct provider.
const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY ?? env.OPEN_AI_API_KEY,
});
const embeddingModel = openai.embedding("text-embedding-3-small");

// Generate embeddings for multiple texts
export async function generateEmbeddings(texts: string[]) {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  });
  return embeddings;
}

// Generate embedding for a single text
async function generateEmbedding(text: string) {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });
  return embedding;
}

// Vector similarity search using pgvector
const SIMILARITY_THRESHOLD = 0.3;

export async function searchSimilarContent(
  query: string,
  locale: string,
  limit: number = 5,
) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    const queryVector = JSON.stringify(queryEmbedding);

    // Query pgvector using Drizzle with cosine distance, filtered by similarity threshold
    const results = await db.execute(
      sql`
        SELECT
          id,
          content,
          metadata,
          1 - (embedding <=> ${queryVector}::vector) as similarity
        FROM ${documents}
        WHERE metadata ->> 'locale' = ${locale}
          AND 1 - (embedding <=> ${queryVector}::vector) >= ${SIMILARITY_THRESHOLD}
        ORDER BY embedding <=> ${queryVector}::vector
        LIMIT ${limit}
      `,
    );

    if (!isProduction) {
      console.log(
        `Found ${results.rows.length} similar ${locale} documents for query: "${query}" (threshold: ${SIMILARITY_THRESHOLD})`,
      );
    }

    const typedResults = results.rows as Array<{
      id: string;
      content: string;
      metadata: unknown;
      similarity: number;
    }>;

    return typedResults.map((result) => ({
      ...result,
      content: localizeSearchDocument(result.content, locale),
    }));
  } catch (error) {
    console.error("Error searching similar content:", error);
    return [];
  }
}
