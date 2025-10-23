import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { vector } from 'pgvector/drizzle-orm';

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content'),
  embedding: vector('embedding', { size: 1536 }),
  metadata: jsonb('metadata')
});

// Users table for authentication
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('email_verified'),
  createdAt: timestamp('created_at').defaultNow(),
  blocked: boolean('blocked').default(false)
});

// Chat sessions table
export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id'), // Nullable text field - stores "session-{uuid}" for anonymous or user ID when authenticated
  sessionId: text('session_id').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastActivityAt: timestamp('last_activity_at').defaultNow()
});

// Chat messages for history
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: text('session_id').references(() => chatSessions.sessionId),
  role: text('role').notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  tokens: integer('tokens'),
  createdAt: timestamp('created_at').defaultNow()
});

// Verification tokens for magic link authentication
export const verificationTokens = pgTable('verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: text('token').unique().notNull(),
  email: text('email').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow()
});
