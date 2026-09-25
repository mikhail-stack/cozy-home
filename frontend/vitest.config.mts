import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Отдельный тестовый раннер (Vitest), не связан со сборкой Next.js/
// Turbopack — только для unit/component/integration тестов. Алиас "@/*"
// зеркалит tsconfig.json, чтобы импорты в тестах совпадали с исходниками.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.tsx"],
    // e2e/ — Playwright-тесты (свой раннер, свой test/expect с фикстурой
    // page), их нельзя запускать через Vitest.
    exclude: ["node_modules", ".next", "e2e"],
  },
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
});
