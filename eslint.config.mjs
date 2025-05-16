/**
 * ESLint flat-config
 * -----------------------------------------------------------------------------
 * 1. Base presets   : Next.js + TypeScript    (via FlatCompat)
 * 2. Project rules  : file-size guard, no raw HEX, import/order, console
 * 3. Import plugin  : registered once here so it isn’t “redefined” later
 * 4. Path alias     : makes import rules resolve @/* → ./src/*
 * 5. Vitest override: test-globals & recommended rules
 */

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import vitestPlugin from "eslint-plugin-vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  /* ----------------------------------------------------------------------- */
  /* 1️⃣  Base Next.js + TS presets (unchanged from bootstrap)               */
  /* ----------------------------------------------------------------------- */
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),

  /* ----------------------------------------------------------------------- */
  /* 2️⃣  Project-wide rule block                                            */
  /* ----------------------------------------------------------------------- */
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: [".next/**", "node_modules/**"],

    /* Make import/no-unresolved understand tsconfig paths ( @/* ) */
    // settings: { "import/resolver": { typescript: true },
    //   "import/resolver": {
    //     typescript: {
    //       project: "./tsconfig.json"
    //     },
    //     node: {
    //       paths: ["src"],
    //       extensions: [".js", ".jsx", ".ts", ".tsx"],
    //     },
    //   },
    // },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
        node: {
          paths: ["src"],
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },

    rules: {
      /* Guard-rails ------------------------------------------------------- */
      "max-lines": [
        "warn",
        { max: 300, skipComments: true, skipBlankLines: true },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/#[0-9a-f]{3,6}$/i]",
          message:
            "Use Tailwind semantic token classes instead of raw HEX colours.",
        },
      ],

      /* Import hygiene ---------------------------------------------------- */
      "import/order": [
        "warn",
        {
          groups: [
            "type",
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-unresolved": "error", // Error on bad/unknown import paths
      "import/newline-after-import": "warn", // Require blank line after imports

      /* Misc -------------------------------------------------------------- */
      "no-console": ["warn", { allow: ["warn", "error"] }],

      /* Ignore intentionally-unused leading-underscore params (stubs) */
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },

  /* ----------------------------------------------------------------------- */
  /* 3️⃣  Vitest override (test files only)                                  */
  /* ----------------------------------------------------------------------- */
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    plugins: { vitest: vitestPlugin },
    env: { "vitest/globals": true },
    rules: vitestPlugin.configs.recommended.rules,
  },
];
