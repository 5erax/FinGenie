import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    rules: {
      // NestJS uses empty interfaces and parameter decorators
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Allow explicit any for NestJS decorators and pipes
      "@typescript-eslint/no-explicit-any": "warn",
      // NestJS requires empty constructors for DI
      "no-useless-constructor": "off",
      "@typescript-eslint/no-useless-constructor": "off",
      // Allow require imports (used in some NestJS patterns)
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
