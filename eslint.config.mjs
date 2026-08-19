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
    "scratch/**",
    "hirego-app/**",
    // One-off local migration helpers are not application source.
    "fix_duplicates.js",
    "fix_sections.js",
    "fix_styles.js",
    "refactor.js",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-img-element": "off",
      "@next/next/no-page-custom-font": "off",
      "jsx-a11y/alt-text": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/purity": "warn",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["scripts/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
