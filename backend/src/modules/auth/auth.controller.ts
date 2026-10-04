import type { RequestHandler, Response } from "express";
import { env } from "../../config/env.js";
import { parseBody } from "../../lib/validate.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.schemas.js";
import * as authService from "./auth.service.js";

// Имя куки зафиксировано фронтендом: frontend/proxy.ts по ней решает,
// пускать ли на /profile и /admin. path "/" — чтобы Next видел куку на
// своих страницах (за nginx фронт и API на одном домене).
export const REFRESH_COOKIE = "refresh_token";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/",
} as const;

const respond = (res: Response, result: authService.AuthResult) => {
  res.cookie(REFRESH_COOKIE, result.refreshToken, {
    ...cookieOptions,
    ...(result.persistent ? { maxAge: result.refreshTtlSeconds * 1000 } : {}),
  });
  res.json({ user: result.user, accessToken: result.accessToken });
};

export const register: RequestHandler = async (req, res) => {
  const result = await authService.register(parseBody(registerSchema, req.body));
  res.status(201);
  respond(res, result);
};

export const login: RequestHandler = async (req, res) => {
  respond(res, await authService.login(parseBody(loginSchema, req.body)));
};

export const refresh: RequestHandler = async (req, res) => {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  res.json(await authService.refresh(cookies?.[REFRESH_COOKIE]));
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  res.status(204).end();
};

const GENERIC_FORGOT_MESSAGE = "Если такой email зарегистрирован, на него отправлен код";

// Ответ одинаков независимо от того, существует ли email — иначе эндпоинт
// выдавал бы, какие адреса зарегистрированы в магазине.
export const forgotPassword: RequestHandler = async (req, res) => {
  await authService.requestPasswordReset(parseBody(forgotPasswordSchema, req.body));
  res.json({ message: GENERIC_FORGOT_MESSAGE });
};

export const resetPassword: RequestHandler = async (req, res) => {
  res.json(await authService.resetPassword(parseBody(resetPasswordSchema, req.body)));
};

export const me: RequestHandler = async (req, res) => {
  // requireAuth гарантирует req.user; данные читаем из БД, а не из токена.
  res.json({ user: await authService.getUser(req.user!.sub) });
};
