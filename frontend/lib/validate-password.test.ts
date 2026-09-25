import { describe, expect, it } from "vitest";
import { getPasswordError, MIN_PASSWORD_LENGTH } from "@/lib/validate-password";

describe("getPasswordError", () => {
  it("требует минимум 8 символов", () => {
    expect(getPasswordError("short", "short")).toBe("Пароль должен содержать минимум 8 символов");
  });

  it("принимает пароль ровно минимальной длины", () => {
    const password = "a".repeat(MIN_PASSWORD_LENGTH);
    expect(getPasswordError(password, password)).toBeNull();
  });

  it("требует совпадения пароля и подтверждения", () => {
    expect(getPasswordError("password1", "password2")).toBe("Пароли не совпадают");
  });

  it("возвращает null для валидных совпадающих паролей", () => {
    expect(getPasswordError("password123", "password123")).toBeNull();
  });
});
