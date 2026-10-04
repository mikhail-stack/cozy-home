import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { startPolling } from "./modules/telegram/telegram.bot.js";

createApp().listen(env.PORT, () => {
  console.log(`API запущен на http://localhost:${env.PORT}`);
});

// Бот живёт в этом же процессе (docs/architecture.md, раздел 3); без токена
// не запускается — остальное API работает.
if (env.TELEGRAM_BOT_TOKEN) {
  const stopBot = startPolling();
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      stopBot();
      process.exit(0);
    });
  }
  console.log("Telegram-бот запущен (long polling)");
} else {
  console.log("Telegram-бот отключён: TELEGRAM_BOT_TOKEN не задан");
}
