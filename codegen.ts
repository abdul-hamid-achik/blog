
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.GRAPHQL_CODEGEN_SCHEMA_URL || "https://www.abdulachik.dev/api/graphql",
  generates: {
    ".generated/graphql.ts": {
      plugins: ["typescript", "typescript-resolvers"]
    },
    ".generated/graphql.schema.json": {
      plugins: ["introspection"]
    }
  }
};

export default config;
