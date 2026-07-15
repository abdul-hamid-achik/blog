import { readdirSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  allPages,
  allPaintings,
  allPosts,
  allPrompts,
} from "../.content-collections/generated/index.js";

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function sourceMdxPaths(directory: string) {
  return readdirSync(join(repositoryRoot, directory), {
    recursive: true,
    encoding: "utf8",
  })
    .filter((filePath) => filePath.endsWith(".mdx"))
    .map((filePath) => filePath.split(sep).join("/"))
    .sort();
}

const collections = [
  {
    name: "posts",
    directory: "content/posts",
    documents: allPosts,
  },
  {
    name: "pages",
    directory: "content/pages",
    documents: allPages,
  },
  {
    name: "paintings",
    directory: "content/paintings",
    documents: allPaintings,
  },
  {
    name: "prompts",
    directory: "content/prompts",
    documents: allPrompts,
  },
] as const;

describe("Content Collections generation", () => {
  it.each(collections)(
    "indexes every $name source document",
    ({ directory, documents }) => {
      const generatedPaths = documents
        .map((document) => document._meta.filePath)
        .sort();

      expect(generatedPaths).toEqual(sourceMdxPaths(directory));
    },
  );
});
