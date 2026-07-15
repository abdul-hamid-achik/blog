import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import promise from "eslint-plugin-promise";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    plugins: { promise },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-async-promise-executor": "error",
      "require-await": "error",
      "promise/no-callback-in-promise": "error",
      "promise/no-promise-in-callback": "error",
      "promise/no-nesting": "warn",
      "promise/no-new-statics": "error",
      "promise/no-return-in-finally": "warn",
      "promise/valid-params": "warn",
    },
  },
  {
    files: ["components/mdx-components.tsx"],
    rules: {
      "react-hooks/static-components": "off",
    },
  },
  globalIgnores([
    ".content-collections/**",
    ".generated/**",
    ".next/**",
    "coverage/**",
    "public/**",
  ]),
]);
