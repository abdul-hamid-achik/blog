import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { vector } from 'pgvector/drizzle-orm';

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content'),
  embedding: vector('embedding', { size: 1536 }),
  metadata: jsonb('metadata')
});
