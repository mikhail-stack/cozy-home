import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

// prettierConfig — последним, чтобы отключить стилистические правила
// ESLint, конфликтующие с форматированием Prettier.
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    ignores: ["dist/**", "node_modules/**", "src/generated/**"],
  },
);
