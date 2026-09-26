import { Router } from "express";
import { requireRole } from "../../middlewares/auth.middleware.js";
import * as controller from "./about.controller.js";

export const aboutRouter = Router();

// Страница «О магазине» видна гостю (ТЗ, раздел 3), редактирует только admin.
aboutRouter.get("/", controller.get);
aboutRouter.put("/", requireRole("admin"), controller.save);
