import { defineConfig, devices } from "@playwright/test";

// E2E — реальный браузер поверх реального dev-сервера (не мок, в отличие
// от Vitest-тестов). reuseExistingServer: если `npm run dev` уже запущен
// локально — используем его; на CI (process.env.CI) всегда поднимаем
// свежий процесс, чтобы тесты не зависели от постороннего состояния.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
