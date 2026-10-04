import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { signAccessToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";

// Правка профиля (доработка пункта 23 по решению из чата 2026-10-04):
// имя/email/телефон — PATCH /api/auth/me, пароль — отдельным эндпоинтом,
// требующим текущий пароль.
const app = createApp();

interface UserBody {
  user: { id: string; name: string; email: string; phone: string | null; role: string };
  message: string;
}
const json = (res: request.Response) => res.body as UserBody;

let userId: string;
let token: string;
const PASSWORD = "old-password1";

const auth = (req: request.Test) => req.set("Authorization", `Bearer ${token}`);
const patchMe = (body: object) => auth(request(app).patch("/api/auth/me")).send(body);
const patchPassword = (body: object) =>
  auth(request(app).patch("/api/auth/me/password")).send(body);
const login = (password: string, email = "anna@example.com") =>
  request(app).post("/api/auth/login").send({ email, password });

beforeEach(async () => {
  await prisma.passwordResetCode.deleteMany();
  await prisma.user.deleteMany();
  const user = await prisma.user.create({
    data: { name: "Анна", email: "anna@example.com", password: await bcrypt.hash(PASSWORD, 10) },
  });
  userId = user.id;
  token = signAccessToken({ sub: user.id, role: "user" });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("PATCH /api/auth/me", () => {
  it("без токена → 401", async () => {
    expect((await request(app).patch("/api/auth/me").send({ name: "x" })).status).toBe(401);
  });

  it("меняет имя и телефон, email не трогается", async () => {
    const res = await patchMe({ name: "Анна Коваленко", phone: "0501234567" });

    expect(res.status).toBe(200);
    expect(json(res).user).toMatchObject({
      name: "Анна Коваленко",
      email: "anna@example.com",
      phone: "+380501234567",
    });
  });

  it("телефон принимается в любом украинском виде", async () => {
    for (const phone of ["+380501234567", "380501234567", "(050) 123-45-67"]) {
      expect(json(await patchMe({ phone })).user.phone).toBe("+380501234567");
    }
  });

  it.each([[null], [""], ["   "]])("телефон можно снять значением %j", async (phone) => {
    await patchMe({ phone: "0501234567" });
    const res = await patchMe({ phone });
    expect(json(res).user.phone).toBeNull();
  });

  it("поле, которое не прислали, не меняется", async () => {
    await patchMe({ phone: "0501234567" });
    const res = await patchMe({ name: "Новое имя" });
    expect(json(res).user).toMatchObject({ name: "Новое имя", phone: "+380501234567" });
  });

  it("меняет email — им можно войти, старый больше не подходит", async () => {
    const res = await patchMe({ email: "NEW@Example.com" });

    expect(res.status).toBe(200);
    expect(json(res).user.email).toBe("new@example.com");
    expect((await login(PASSWORD, "new@example.com")).status).toBe(200);
    expect((await login(PASSWORD, "anna@example.com")).status).toBe(401);
  });

  it("email уже занят другим аккаунтом → 409, ничего не меняется", async () => {
    await prisma.user.create({ data: { name: "Игорь", email: "igor@example.com", password: "x" } });

    const res = await patchMe({ email: "igor@example.com" });

    expect(res.status).toBe(409);
    expect(json(res).message).toBe("Такой email уже зарегистрирован");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).email).toBe(
      "anna@example.com",
    );
  });

  it("email, занятый самим собой (без изменений) — не ошибка", async () => {
    expect((await patchMe({ email: "anna@example.com" })).status).toBe(200);
  });

  it("пустое тело → 400, «Нет полей для обновления»", async () => {
    const res = await patchMe({});
    expect(res.status).toBe(400);
    expect(json(res).message).toBe("Нет полей для обновления");
  });

  it.each([
    ["пустое имя", { name: "" }, "Введите имя"],
    ["некорректный email", { email: "not-an-email" }, "Некорректный email"],
    ["некорректный телефон", { phone: "123" }, "Введите корректный номер телефона"],
    ["не украинский телефон", { phone: "+48501234567" }, "Введите корректный номер телефона"],
  ])("%s → 400", async (_name, patch, expected) => {
    const res = await patchMe(patch);
    expect(res.status).toBe(400);
    expect(json(res).message).toBe(expected);
  });

  it("токен удалённого пользователя → 401", async () => {
    await prisma.user.delete({ where: { id: userId } });
    expect((await patchMe({ name: "x" })).status).toBe(401);
  });
});

describe("PATCH /api/auth/me/password", () => {
  const valid = {
    currentPassword: PASSWORD,
    newPassword: "new-password1",
    confirmNewPassword: "new-password1",
  };

  it("без токена → 401", async () => {
    expect((await request(app).patch("/api/auth/me/password").send(valid)).status).toBe(401);
  });

  it("меняет пароль: старый больше не подходит, новый работает", async () => {
    const res = await patchPassword(valid);

    expect(res.status).toBe(200);
    expect(json(res).message).toBe("Пароль успешно изменён");
    expect((await login(PASSWORD)).status).toBe(401);
    expect((await login("new-password1")).status).toBe(200);
  });

  it("неверный текущий пароль → 400, пароль не меняется", async () => {
    const res = await patchPassword({ ...valid, currentPassword: "wrong-password" });

    expect(res.status).toBe(400);
    expect(json(res).message).toBe("Неверный текущий пароль");
    expect((await login(PASSWORD)).status).toBe(200);
  });

  it.each([
    ["нет текущего пароля", { currentPassword: "" }, "Введите текущий пароль"],
    [
      "короткий новый пароль",
      { newPassword: "short1", confirmNewPassword: "short1" },
      "Пароль должен содержать минимум 8 символов",
    ],
    ["пароли не совпадают", { confirmNewPassword: "other-password" }, "Пароли не совпадают"],
  ])("%s → 400", async (_name, patch, expected) => {
    const res = await patchPassword({ ...valid, ...patch });
    expect(res.status).toBe(400);
    expect(json(res).message).toBe(expected);
  });

  it("токен удалённого пользователя → 401", async () => {
    await prisma.user.delete({ where: { id: userId } });
    expect((await patchPassword(valid)).status).toBe(401);
  });
});
