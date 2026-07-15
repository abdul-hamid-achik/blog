import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  gateway: vi.fn(() => ({ id: "gateway-model" })),
  createOpenAI: vi.fn(() => ({
    embedding: vi.fn(() => ({ id: "embedding-model" })),
  })),
  embed: vi.fn(),
  embedMany: vi.fn(),
  execute: vi.fn(),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
    strings: [...strings],
    values,
  })),
  env: {
    OPENAI_API_KEY: "primary-key",
    OPEN_AI_API_KEY: "legacy-key",
  },
}));

vi.mock("@ai-sdk/gateway", () => ({ gateway: mocks.gateway }));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: mocks.createOpenAI }));
vi.mock("ai", () => ({ embed: mocks.embed, embedMany: mocks.embedMany }));
vi.mock("@/lib/db", () => ({ db: { execute: mocks.execute } }));
vi.mock("@/env.mjs", () => ({ env: mocks.env }));
vi.mock("@/db/schema", () => ({ documents: { name: "documents" } }));
vi.mock("drizzle-orm", () => ({ sql: mocks.sql }));

import {
  conciergeModel,
  generateEmbeddings,
  getConciergeProviderOptions,
  searchSimilarContent,
} from "../lib/ai";

describe("AI provider helpers", () => {
  beforeEach(() => {
    mocks.embed.mockResolvedValue({ embedding: [0.1, 0.2] });
    mocks.embedMany.mockResolvedValue({ embeddings: [[0.1], [0.2]] });
  });

  it("configures the primary concierge and direct embedding models once", () => {
    expect(conciergeModel).toEqual({ id: "gateway-model" });
  });

  it("adds fallback routing, attribution, environment, and optional locale tags", () => {
    expect(
      getConciergeProviderOptions({
        feature: "stream",
        user: "reader-1",
        locale: "es",
      }),
    ).toEqual({
      gateway: {
        models: ["google/gemini-3-flash"],
        user: "reader-1",
        tags: ["feature:stream", "env:development", "locale:es"],
      },
    });

    expect(
      getConciergeProviderOptions({ feature: "graphql", user: "reader-2" })
        .gateway.tags,
    ).toEqual(["feature:graphql", "env:development"]);
  });

  it("generates embeddings for batches", async () => {
    await expect(generateEmbeddings(["one", "two"])).resolves.toEqual([
      [0.1],
      [0.2],
    ]);
    expect(mocks.embedMany).toHaveBeenCalledWith({
      model: { id: "embedding-model" },
      values: ["one", "two"],
    });
  });

  it("filters vector search by locale and localizes stored result labels", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    mocks.execute.mockResolvedValueOnce({
      rows: [
        {
          id: "post-1",
          content: "Type\nPost\nTitle\nA title\nBody\nBody text",
          metadata: { locale: "es" },
          similarity: 0.91,
        },
      ],
    });

    const results = await searchSimilarContent("Lacan", "es", 3);

    expect(mocks.embed).toHaveBeenCalledWith({
      model: { id: "embedding-model" },
      value: "Lacan",
    });
    expect(mocks.sql).toHaveBeenCalled();
    const query = mocks.execute.mock.calls[0][0] as { values: unknown[] };
    expect(query.values).toEqual(
      expect.arrayContaining(["[0.1,0.2]", "es", 0.3, 3]),
    );
    expect(results).toEqual([
      expect.objectContaining({
        id: "post-1",
        similarity: 0.91,
        content: expect.stringContaining("Tipo\nEnsayo\nTítulo\nA title"),
      }),
    ]);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("Found 1 similar es documents"),
    );
  });

  it("returns an empty result when embedding or storage fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.embed.mockRejectedValueOnce(new Error("provider unavailable"));

    await expect(searchSimilarContent("query", "ru")).resolves.toEqual([]);
    expect(error).toHaveBeenCalledWith(
      "Error searching similar content:",
      expect.any(Error),
    );
  });
});
