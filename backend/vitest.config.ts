import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    // Тесты на реальной БД делят одну тестовую базу — параллельные файлы
    // затирали бы данные друг друга.
    fileParallelism: false,
  },
});
