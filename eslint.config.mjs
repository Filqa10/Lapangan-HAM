import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Agent bundles and local tool caches are not part of the app source.
    ".agents/**",
    ".opencode/**",
    ".codex/**",
    ".claude/**",
    ".impeccable/**",
    ".kiro/**",
  ]),
]);

export default eslintConfig;
