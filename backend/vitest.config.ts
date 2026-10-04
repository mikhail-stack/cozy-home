import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Секреты фиксированы для тестов — не зависим от локального .env.
    env: {
      JWT_ACCESS_SECRET: "test-access-secret",
      JWT_REFRESH_SECRET: "test-refresh-secret",
      // Пустые — иначе тесты «без ключей» зависели бы от того, заполнил ли
      // разработчик реальные ключи Cloudinary в своём .env.
      CLOUDINARY_CLOUD_NAME: "",
      CLOUDINARY_API_KEY: "",
      CLOUDINARY_API_SECRET: "",
      // Пустые — тесты не должны ходить в реальный Telegram, что бы ни лежало в .env.
      TELEGRAM_BOT_TOKEN: "",
      TELEGRAM_ADMIN_CHAT_ID: "",
      // Пустые — тесты не должны слать реальную почту, что бы ни лежало в .env.
      SMTP_HOST: "",
      SMTP_USER: "",
      SMTP_PASS: "",
    },
    globalSetup: ["./test/global-setup.ts"],
    // Тесты на реальной БД делят одну тестовую базу — параллельные файлы
    // затирали бы данные друг друга.
    fileParallelism: false,
  },
});
