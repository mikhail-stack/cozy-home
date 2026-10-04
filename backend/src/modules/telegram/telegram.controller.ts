import type { RequestHandler } from "express";
import * as telegramService from "./telegram.service.js";

// requireAuth на роутере гарантирует req.user; привязка — всегда к своему аккаунту.
const userId = (req: Parameters<RequestHandler>[0]) => req.user!.sub;

export const createLink: RequestHandler = async (req, res) => {
  res.json(await telegramService.createLinkToken(userId(req)));
};

export const status: RequestHandler = async (req, res) => {
  res.json(await telegramService.getLinkStatus(userId(req)));
};
