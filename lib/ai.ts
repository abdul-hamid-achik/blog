import { env } from "@/env.mjs";
import { isProduction } from "@/lib/utils";
import { openai } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';
import { db } from '@/lib/db';
import { documents } from '@/db/schema';
import { sql } from 'drizzle-orm';

// Chat model - using gpt-5-nano for cost-effectiveness
export const chatModel = openai('gpt-5-nano');

// Embedding model - text-embedding-3-small for cost-effective embeddings
export const embeddingModel = openai.textEmbeddingModel('text-embedding-3-small');

// Generate embeddings for multiple texts
export async function generateEmbeddings(texts: string[]) {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts
  });
  return embeddings;
}

// Generate embedding for a single text
export async function generateEmbedding(text: string) {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text
  });
  return embedding;
}

// Vector similarity search using pgvector
export async function searchSimilarContent(
  query: string,
  limit: number = 5
) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Query pgvector using Drizzle with cosine distance
    const results = await db.execute(
      sql`
        SELECT 
          id, 
          content, 
          metadata,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
        FROM ${documents}
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${limit}
      `
    );

    if (!isProduction) {
      console.log(`📚 Found ${results.rows.length} similar documents for query: "${query}"`);
    }

    return results.rows as Array<{
      id: string;
      content: string;
      metadata: any;
      similarity: number;
    }>;
  } catch (error) {
    console.error('Error searching similar content:', error);
    return [];
  }
}
