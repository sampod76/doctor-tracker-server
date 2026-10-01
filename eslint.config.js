import js from "@eslint/js";
import eslintComments from "eslint-plugin-eslint-comments";
import jestPlugin from "eslint-plugin-jest";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 🔥 JS / Config files (Node পরিবেশ)
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },

  // 🔥 TypeScript backend (RELAXED MODE)
  {
    files: ["**/*.ts"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      jest: jestPlugin,
      "eslint-comments": eslintComments,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      // ✅ disable strict rules (unblock dev)
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-expressions": "off",

      // core rules
      "no-unused-vars": "off",
      "no-useless-assignment": "off",
      "no-undef": "off",
      "no-console": "off",

      // eslint-comments plugin
      "eslint-comments/no-unused-disable": "off",
    },
  },

  // 🔥 Ignore files
  {
    ignores: [
      "node_modules",
      "dist",
      "logs",
      "coverage",
      ".env",
      ".env.*",
      "*.log",
      "*.tsbuildinfo",
      "public",
      ".vscode",
    ],
  },
];
