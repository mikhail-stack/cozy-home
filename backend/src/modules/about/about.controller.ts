import type { RequestHandler } from "express";
import { parseBody } from "../../lib/validate.js";
import { aboutSchema } from "./about.schemas.js";
import * as aboutService from "./about.service.js";

export const get: RequestHandler = async (_req, res) => {
  res.json(await aboutService.getAbout());
};

export const save: RequestHandler = async (req, res) => {
  res.json(await aboutService.saveAbout(parseBody(aboutSchema, req.body)));
};
