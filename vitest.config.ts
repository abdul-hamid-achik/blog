import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const repositoryRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": repositoryRoot,
      "content-collections": fileURLToPath(
        new URL("./.content-collections/generated/index.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    exclude: ["tests/cairn/**", "node_modules/**", ".next/**"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "json-summary", "html", "lcov"],
      include: ["lib/**/*.ts"],
      exclude: ["lib/types.ts"],
      skipFull: true,
      thresholds: {
        statements: 95,
        branches: 88,
        functions: 95,
        lines: 95,
        "lib/chat-safety.ts": { 100: true },
        "lib/moderation.ts": {
          statements: 95,
          branches: 85,
          functions: 100,
          lines: 95,
        },
      },
    },
  },
});
