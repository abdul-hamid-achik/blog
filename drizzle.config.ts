import { isProduction } from "@/lib/utils";
import type { Config } from "drizzle-kit";
import { env } from "./env.mjs";

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  driver: 'pg',
  dbCredentials: {
    ssl: isProduction,
    connectionString: env.POSTGRES_URL,
  },
  verbose: !isProduction
} satisfies Config;
