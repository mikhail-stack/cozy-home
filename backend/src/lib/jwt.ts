import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";

const payloadSchema = z.object({
  sub: z.string(),
  role: z.enum(["user", "admin"]),
});

export type TokenPayload = z.infer<typeof payloadSchema>;

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN });
}

export function signRefreshToken(payload: TokenPayload, ttlSeconds: number): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: ttlSeconds });
}

// Проверка не бросает: любой сбой (подпись, срок, форма payload) → null,
// вызывающий код отвечает 401 и не различает причины.
function verify(token: string, secret: string): TokenPayload | null {
  try {
    return payloadSchema.parse(jwt.verify(token, secret));
  } catch {
    return null;
  }
}

export const verifyAccessToken = (token: string) => verify(token, env.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token: string) => verify(token, env.JWT_REFRESH_SECRET);
