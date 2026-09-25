import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { HttpError } from "./lib/errors.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { cartRouter } from "./modules/cart/cart.routes.js";
import { productsRouter } from "./modules/products/products.routes.js";

// Сборка приложения отдельно от listen() (server.ts) — supertest в тестах
// работает с приложением напрямую, без открытия порта.
export function createApp() {
  const app = express();

  // credentials: true — иначе браузер не отправит refresh-куку кросс-порт
  // в dev (фронт :3000, API :4000).
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api/auth", authRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/cart", cartRouter);

  app.use((_req, _res, next) => {
    next(new HttpError(404, "Не найдено"));
  });
  app.use(errorHandler);

  return app;
}
