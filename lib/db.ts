import * as schema from '@/db/schema';
import { isProduction } from "@/lib/utils";
import { sql as sqlVercel } from '@vercel/postgres';
import { sql as sqlDrizzle } from 'drizzle-orm';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { migrate as migrateNode } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as drizzleVercel } from 'drizzle-orm/vercel-postgres';
import { migrate as migrateVercel } from 'drizzle-orm/vercel-postgres/migrator';
import { Pool } from 'pg';

const options = {
  schema,
  verbose: !isProduction,
  log: !isProduction,
  ssl: isProduction
}

const migratorOptions = { migrationsFolder: './db/migrations' }

export const sql = isProduction ? sqlVercel : sqlDrizzle

export const db =
  isProduction
    ? drizzleVercel(sqlVercel, options)
    : drizzleNode(new Pool({ connectionString: process.env.POSTGRES_URL, ssl: isProduction }), options);

export async function migrate() {
  let exitCode = 0
  try {
    console.log('🚀 Starting database migration...');
    if (isProduction) {
      console.log('🌐 Running in production mode...');
      await migrateVercel(db, migratorOptions);
    } else {
      console.log('🔧 Running in development mode...');
      await migrateNode(db, migratorOptions);
    }
    console.log('✅ Database migration completed!');

  } catch (error) {
    console.error('😱 An error occurred during the database migration:', error);
    exitCode = 1
  }

  process.exit(exitCode)
}

