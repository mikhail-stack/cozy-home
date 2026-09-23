import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

// prettierConfig — последним, чтобы отключить стилистические правила
// ESLint, конфликтующие с форматированием Prettier.
const eslintConfig = defineConfig([...nextVitals, ...nextTs, prettierConfig]);

export default eslintConfig;
