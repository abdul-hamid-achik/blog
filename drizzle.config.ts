import { isProduction } from "@/lib/utils";
import type { Config } from "drizzle-kit";
import { env } from "./env.mjs";

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: 'postgresql',
  dbCredentials: {
    ssl: isProduction,
    url: env.POSTGRES_URL,
  },
  verbose: !isProduction
} satisfies Config;
