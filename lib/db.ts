import * as schema from '@/db/schema';
import { isProduction } from "@/lib/utils";
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '@/env.mjs';

const options = {
  schema,
  verbose: !isProduction,
  logger: !isProduction,
}

const sql = neon(env.DATABASE_URL)

export const db = drizzle(sql, options);
