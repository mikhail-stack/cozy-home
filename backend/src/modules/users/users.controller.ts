import type { RequestHandler } from "express";
import { parseBody } from "../../lib/validate.js";
import { listUsersSchema, updateRoleSchema } from "./users.schemas.js";
import * as usersService from "./users.service.js";

// requireRole на роутере гарантирует req.user; кто действует — из токена.
const actorId = (req: Parameters<RequestHandler>[0]) => req.user!.sub;
const targetId = (req: Parameters<RequestHandler>[0]) => String(req.params.id);

export const list: RequestHandler = async (req, res) => {
  res.json(await usersService.listUsers(parseBody(listUsersSchema, req.query)));
};

export const setRole: RequestHandler = async (req, res) => {
  const { role } = parseBody(updateRoleSchema, req.body);
  res.json(await usersService.setRole(actorId(req), targetId(req), role));
};

export const remove: RequestHandler = async (req, res) => {
  await usersService.removeUser(actorId(req), targetId(req));
  res.status(204).end();
};
