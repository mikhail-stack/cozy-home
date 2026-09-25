import type { RequestHandler } from "express";
import { HttpError } from "../lib/errors.js";
import { verifyAccessToken, type TokenPayload } from "../lib/jwt.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: TokenPayload;
  }
}

// Единая точка проверки JWT и роли (docs/architecture.md, раздел 3).
// Роль берётся из access-токена (живёт 15 минут) — смена роли в админке
// вступает в силу не позже чем через это время, без запроса в БД на
// каждый вызов.
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  const payload = token ? verifyAccessToken(token) : null;

  if (!payload) {
    next(new HttpError(401, "Требуется авторизация"));
    return;
  }

  req.user = payload;
  next();
};

// Для эндпоинтов, открытых и гостям (заказ без регистрации, ТЗ раздел 5).
// Без заголовка — гость; заголовок с негодным токеном — 401, а не молчаливый
// «гость»: иначе заказ просроченной сессии потерял бы привязку к аккаунту
// вместо того, чтобы фронтенд обновил токен (lib/api.ts) и повторил запрос.
export const optionalAuth: RequestHandler = (req, res, next) => {
  if (!req.headers.authorization) {
    next();
    return;
  }
  requireAuth(req, res, next);
};

export const requireRole =
  (...roles: TokenPayload["role"][]): RequestHandler =>
  (req, res, next) => {
    requireAuth(req, res, (error?: unknown) => {
      if (error) {
        next(error);
      } else if (!req.user || !roles.includes(req.user.role)) {
        next(new HttpError(403, "Недостаточно прав"));
      } else {
        next();
      }
    });
  };
