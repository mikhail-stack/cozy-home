import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { HttpError } from "../lib/errors.js";
import { signAccessToken } from "../lib/jwt.js";
import { requireAuth, requireRole } from "./auth.middleware.js";

const run = (
  handler: (req: Request, res: Response, next: (error?: unknown) => void) => void,
  authorization?: string,
) => {
  const req = { headers: { authorization } } as Request;
  const next = vi.fn();
  handler(req, {} as Response, next);
  return { req, next };
};

const bearer = (role: "user" | "admin") => `Bearer ${signAccessToken({ sub: "u1", role })}`;

describe("requireAuth", () => {
  it("пропускает с валидным токеном и кладёт пользователя в req.user", () => {
    const { req, next } = run(requireAuth, bearer("user"));
    expect(req.user).toMatchObject({ sub: "u1", role: "user" });
    expect(next).toHaveBeenCalledWith();
  });

  it.each([
    ["без заголовка", undefined],
    ["без схемы Bearer", signAccessToken({ sub: "u1", role: "user" })],
    ["с мусорным токеном", "Bearer garbage"],
  ])("отвечает 401 %s", (_name, header) => {
    const { next } = run(requireAuth, header);
    const error = next.mock.calls[0]?.[0] as HttpError;
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(401);
  });
});

describe("requireRole", () => {
  it("пропускает нужную роль", () => {
    const { next } = run(requireRole("admin"), bearer("admin"));
    expect(next).toHaveBeenCalledWith();
  });

  it("отвечает 403 обычному пользователю на админский роут", () => {
    const { next } = run(requireRole("admin"), bearer("user"));
    expect((next.mock.calls[0]?.[0] as HttpError).status).toBe(403);
  });

  it("без токена отвечает 401, а не 403", () => {
    const { next } = run(requireRole("admin"));
    expect((next.mock.calls[0]?.[0] as HttpError).status).toBe(401);
  });
});
