import { Router } from "express";
import { requireRole } from "../../middlewares/auth.middleware.js";
import * as controller from "./users.controller.js";

// Раздел «Пользователи» админки (ТЗ, раздел 9) — целиком только для admin.
export const usersRouter = Router();

usersRouter.use(requireRole("admin"));

usersRouter.get("/", controller.list);
usersRouter.patch("/:id/role", controller.setRole);
usersRouter.delete("/:id", controller.remove);
