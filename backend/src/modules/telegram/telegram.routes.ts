import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import * as controller from "./telegram.controller.js";

// Привязка Telegram — блок «Безопасность» личного кабинета (ТЗ, раздел 7).
// Сам бот (приём /start) HTTP-роутов не имеет — он опрашивает Telegram (telegram.bot.ts).
export const telegramRouter = Router();

telegramRouter.use(requireAuth);

telegramRouter.post("/link", controller.createLink);
telegramRouter.get("/status", controller.status);
