import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import * as controller from "./cart.controller.js";

// Серверная корзина — только для авторизованных (роль user или admin).
// Гостевая живёт в localStorage и сюда попадает лишь через /merge при
// входе (docs/cozy-home-tz.md, раздел 5).
export const cartRouter = Router();

cartRouter.use(requireAuth);

cartRouter.get("/", controller.get);
cartRouter.delete("/", controller.clear);
cartRouter.post("/items", controller.add);
cartRouter.patch("/items/:productId", controller.setQuantity);
cartRouter.delete("/items/:productId", controller.remove);
cartRouter.post("/merge", controller.merge);
