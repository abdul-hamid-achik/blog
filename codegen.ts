
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: './app/api/graphql/typeDefs.ts',
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
