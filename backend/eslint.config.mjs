import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

// Типизированный линтинг (recommendedTypeChecked) — только для src/**,
// куда смотрит tsconfig.json; иначе parser не находит корневые конфиги
// (eslint.config.mjs, prisma.config.ts) в проекте TypeScript.
// prettierConfig — последним, чтобы отключить стилистические правила
// ESLint, конфликтующие с форматированием Prettier.
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  prettierConfig,
  {
    ignores: ["dist/**", "node_modules/**", "src/generated/**"],
  },
);
