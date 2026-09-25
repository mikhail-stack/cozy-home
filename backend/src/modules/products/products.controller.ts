import type { RequestHandler } from "express";
import { parseBody } from "../../lib/validate.js";
import { createProductSchema, listQuerySchema, updateProductSchema } from "./products.schemas.js";
import * as productsService from "./products.service.js";

// Express 5 типизирует params как string | string[] — у нас все id одиночные.
const idOf = (params: Record<string, string | string[] | undefined>) => String(params.id);

export const list: RequestHandler = async (req, res) => {
  const { category } = parseBody(listQuerySchema, req.query);
  res.json(await productsService.list(category));
};

export const getOne: RequestHandler = async (req, res) => {
  res.json(await productsService.getById(idOf(req.params)));
};

export const create: RequestHandler = async (req, res) => {
  res.status(201).json(await productsService.create(parseBody(createProductSchema, req.body)));
};

export const update: RequestHandler = async (req, res) => {
  res.json(
    await productsService.update(idOf(req.params), parseBody(updateProductSchema, req.body)),
  );
};

export const remove: RequestHandler = async (req, res) => {
  await productsService.remove(idOf(req.params));
  res.status(204).end();
};

export const upload: RequestHandler = async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  res.json({ urls: await productsService.uploadImages(files) });
};
