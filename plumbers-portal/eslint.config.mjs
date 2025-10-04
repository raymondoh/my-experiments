// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  // Ignore build/vendor outputs
  {
    ignores: ["node_modules/**", ".next/**", "coverage/**", "dist/**", "out/**", "public/**"]
  },

  // Next + TS base
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Global tweaks
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/rules-of-hooks": "warn"
    }
  },

  // Node / JS scripts (allow require())
  {
    files: ["**/*.js", "**/*.cjs", "jest.config.js", "jest.setup.js", "scripts/**/*.js", "scripts/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off"
    }
  },

  // Tests
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/display-name": "off",
      "@typescript-eslint/no-unused-vars": "off"
    }
  },

  // API import guard (warning)
  // API import guard (warning)
  {
    files: ["src/app/api/**/*.{ts,tsx}", "src/app/api/auth/[...nextauth]/route.ts"],
    // ⬇️ use `ignores` instead of `excludedFiles`
    ignores: ["**/*.test.{ts,tsx}", "src/app/api/auth/[...nextauth]/route.ts", "src/app/api/stripe/webhook/route.ts"],
    rules: {
      "no-restricted-imports": [
        "off",
        {
          paths: [
            {
              name: "@/auth",
              message: "Prefer a route-local session helper in API routes (or explicitly allow in eslint.config.mjs)."
            }
          ]
        }
      ]
    }
  }
];

export default eslintConfig;
