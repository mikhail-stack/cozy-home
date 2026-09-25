import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "./jwt.js";

const payload = { sub: "user-1", role: "admin" } as const;

describe("jwt", () => {
  it("access-токен восстанавливает sub и role", () => {
    expect(verifyAccessToken(signAccessToken(payload))).toMatchObject(payload);
  });

  it("access и refresh подписаны разными секретами и не взаимозаменяемы", () => {
    expect(verifyAccessToken(signRefreshToken(payload, 60))).toBeNull();
    expect(verifyRefreshToken(signAccessToken(payload))).toBeNull();
  });

  it("просроченный токен отвергается", () => {
    expect(verifyRefreshToken(signRefreshToken(payload, -10))).toBeNull();
  });

  it("токен с чужой подписью и мусор отвергаются, а не бросают", () => {
    const forged = jwt.sign(payload, "чужой-секрет");
    expect(verifyAccessToken(forged)).toBeNull();
    expect(verifyAccessToken("not-a-jwt")).toBeNull();
  });

  it("токен с неизвестной ролью отвергается", () => {
    const badRole = jwt.sign({ sub: "u", role: "root" }, "test-access-secret");
    expect(verifyAccessToken(badRole)).toBeNull();
  });
});
