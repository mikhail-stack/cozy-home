import { Router } from "express";
import { requireRole } from "../../middlewares/auth.middleware.js";
import { uploadImages } from "../../middlewares/upload.middleware.js";
import * as controller from "./products.controller.js";

export const productsRouter = Router();

// Публичные — каталог и страница товара доступны гостю (ТЗ, раздел 3).
productsRouter.get("/", controller.list);
productsRouter.get("/:id", controller.getOne);

// Изменения — только admin. Загрузка фото — отдельный шаг: сначала
// /upload возвращает URL-ы, потом они передаются в images при создании
// или правке товара (docs/architecture.md, раздел 3).
const adminOnly = requireRole("admin");
productsRouter.post("/upload", adminOnly, uploadImages, controller.upload);
productsRouter.post("/", adminOnly, controller.create);
productsRouter.patch("/:id", adminOnly, controller.update);
productsRouter.delete("/:id", adminOnly, controller.remove);
