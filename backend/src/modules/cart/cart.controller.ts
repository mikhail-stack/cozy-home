import type { RequestHandler } from "express";
import { parseBody } from "../../lib/validate.js";
import { addItemSchema, mergeSchema, setQuantitySchema } from "./cart.schemas.js";
import * as cartService from "./cart.service.js";

// requireAuth на роутере гарантирует req.user; корзина всегда своя —
// id пользователя берём из токена, а не из запроса, поэтому чужую
// корзину прочитать или изменить нельзя.
const userId = (req: Parameters<RequestHandler>[0]) => req.user!.sub;
const productIdOf = (req: Parameters<RequestHandler>[0]) => String(req.params.productId);

export const get: RequestHandler = async (req, res) => {
  res.json(await cartService.getCart(userId(req)));
};

export const add: RequestHandler = async (req, res) => {
  const { productId, quantity } = parseBody(addItemSchema, req.body);
  res.json(await cartService.addItem(userId(req), productId, quantity));
};

export const setQuantity: RequestHandler = async (req, res) => {
  const { quantity } = parseBody(setQuantitySchema, req.body);
  res.json(await cartService.setQuantity(userId(req), productIdOf(req), quantity));
};

export const remove: RequestHandler = async (req, res) => {
  res.json(await cartService.removeItem(userId(req), productIdOf(req)));
};

export const clear: RequestHandler = async (req, res) => {
  res.json(await cartService.clear(userId(req)));
};

export const merge: RequestHandler = async (req, res) => {
  const { items } = parseBody(mergeSchema, req.body);
  res.json(await cartService.merge(userId(req), items));
};
