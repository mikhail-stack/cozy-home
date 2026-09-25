import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Секреты фиксированы для тестов — не зависим от локального .env.
    env: {
      JWT_ACCESS_SECRET: "test-access-secret",
      JWT_REFRESH_SECRET: "test-refresh-secret",
    },
    globalSetup: ["./test/global-setup.ts"],
    // Тесты на реальной БД делят одну тестовую базу — параллельные файлы
    // затирали бы данные друг друга.
    fileParallelism: false,
  },
});
