import type { RequestHandler } from "express";
import { parseBody } from "../../lib/validate.js";
import { createOrderSchema, listOrdersSchema, updateStatusSchema } from "./orders.schemas.js";
import * as ordersService from "./orders.service.js";

export const create: RequestHandler = async (req, res) => {
  const input = parseBody(createOrderSchema, req.body);
  res.status(201).json(await ordersService.createOrder(req.user?.sub, input));
};

// Свои заказы — id берётся из токена, чужие увидеть нельзя.
export const listMine: RequestHandler = async (req, res) => {
  res.json({ orders: await ordersService.listMyOrders(req.user!.sub) });
};

export const list: RequestHandler = async (req, res) => {
  res.json(await ordersService.listOrders(parseBody(listOrdersSchema, req.query)));
};

export const get: RequestHandler = async (req, res) => {
  res.json(await ordersService.getOrder(String(req.params.id)));
};

export const updateStatus: RequestHandler = async (req, res) => {
  const { status } = parseBody(updateStatusSchema, req.body);
  res.json(await ordersService.updateStatus(String(req.params.id), status));
};
