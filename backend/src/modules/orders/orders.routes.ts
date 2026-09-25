import { Router } from "express";
import { optionalAuth, requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import * as controller from "./orders.controller.js";

export const ordersRouter = Router();

// Оформить заказ может и гость (ТЗ, раздел 5) — токен необязателен.
ordersRouter.post("/", optionalAuth, controller.create);

// /my — до /:id, иначе «my» разбирался бы как id заказа.
ordersRouter.get("/my", requireAuth, controller.listMine);

ordersRouter.get("/", requireRole("admin"), controller.list);
ordersRouter.get("/:id", requireRole("admin"), controller.get);
ordersRouter.patch("/:id/status", requireRole("admin"), controller.updateStatus);
