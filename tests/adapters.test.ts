import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const neonUrls: string[] = [];
  const drizzleCalls: Array<[unknown, unknown]> = [];

  return {
    neonUrls,
    drizzleCalls,
    neon: vi.fn((url: string) => {
      neonUrls.push(url);
      return "sql-client";
    }),
    drizzle: vi.fn((client: unknown, options: unknown) => {
      drizzleCalls.push([client, options]);
      return { id: "database-client" };
    }),
    simpleFMKeys: [] as string[],
  };
});

vi.mock("@/env.mjs", () => ({
  env: {
    DATABASE_URL: "postgres://database.test/blog",
    LASTFM_API_KEY: "lastfm-key",
  },
}));
vi.mock("@/db/schema", () => ({ users: { id: "users.id" } }));
vi.mock("@neondatabase/serverless", () => ({ neon: mocks.neon }));
vi.mock("drizzle-orm/neon-http", () => ({ drizzle: mocks.drizzle }));
vi.mock("@solely/simple-fm", () => ({
  default: class SimpleFMMock {
    id = "lastfm-client";

    constructor(apiKey: string) {
      mocks.simpleFMKeys.push(apiKey);
    }
  },
}));

import { ApolloClient } from "@apollo/client";

import { createApolloClient } from "../lib/apollo";
import { db } from "../lib/db";
import { lastfm } from "../lib/lastfm";

describe("integration client factories", () => {
  it("creates a locale-aware Apollo client", () => {
    const client = createApolloClient("ru");

    expect(client).toBeInstanceOf(ApolloClient);
    expect(client.extract()).toEqual({});
  });

  it("creates the database client with development diagnostics", () => {
    expect(db).toEqual({ id: "database-client" });
    expect(mocks.neonUrls).toEqual(["postgres://database.test/blog"]);
    expect(mocks.drizzleCalls).toEqual([
      [
        "sql-client",
        {
          schema: { users: { id: "users.id" } },
          verbose: true,
          logger: true,
        },
      ],
    ]);
  });

  it("creates the Last.fm client from server configuration", () => {
    expect(lastfm).toEqual({ id: "lastfm-client" });
    expect(mocks.simpleFMKeys).toEqual(["lastfm-key"]);
  });
});
