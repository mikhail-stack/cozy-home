import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Реальную почту не трогаем — sendMail заглушен, код достаём из аргументов вызова.
vi.mock("../../lib/mailer.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/mailer.js")>()),
  sendMail: vi.fn(() => Promise.resolve(true)),
}));

import { createApp } from "../../app.js";
import { sendMail } from "../../lib/mailer.js";
import { prisma } from "../../lib/prisma.js";

// Восстановление пароля (ТЗ, раздел 7) — канал заменён с Telegram на email
// по решению из чата; формат «код + форма нового пароля» (TTL 15 минут,
// «Код устарел, запросите новый», «Неверный код») сохранён дословно.
const app = createApp();
const send = vi.mocked(sendMail);

interface Body {
  message: string;
}
const json = (res: request.Response) => res.body as Body;

const EMAIL = "anna@example.com";
const forgot = (email: string = EMAIL) =>
  request(app).post("/api/auth/forgot-password").send({ email });
const resetBody = (patch: object = {}) => ({
  email: EMAIL,
  code: "000000",
  password: "new-password1",
  confirmPassword: "new-password1",
  ...patch,
});
const reset = (patch: object = {}) =>
  request(app).post("/api/auth/reset-password").send(resetBody(patch));
const login = (password: string) =>
  request(app).post("/api/auth/login").send({ email: EMAIL, password });

// Код приходит в теле письма-заглушки — достаём его регэкспом, как пользователь
// читал бы его из настоящего письма.
const lastSentCode = () => {
  const text = send.mock.calls.at(-1)?.[2] ?? "";
  return /код подтверждения: (\d{6})/.exec(text)![1];
};
const requestCode = async (email: string = EMAIL) => {
  await forgot(email);
  return lastSentCode();
};

beforeEach(async () => {
  await prisma.passwordResetCode.deleteMany();
  await prisma.user.deleteMany();
  send.mockClear();
  await prisma.user.create({
    data: { name: "Анна", email: EMAIL, password: await bcrypt.hash("old-password1", 10) },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/auth/forgot-password", () => {
  it("существующему email отправляется письмо с шестизначным кодом", async () => {
    const res = await forgot();

    expect(res.status).toBe(200);
    expect(json(res).message).toBe("Если такой email зарегистрирован, на него отправлен код");
    expect(send).toHaveBeenCalledTimes(1);
    const [to, subject, text] = send.mock.calls[0];
    expect(to).toBe(EMAIL);
    expect(subject).toBe("Код для восстановления пароля — Cozy Home");
    expect(text).toMatch(/код подтверждения: \d{6}/);
    expect(text).toContain("15 минут");
  });

  it("незарегистрированный email — тот же ответ, письмо не уходит (без утечки, какие email есть)", async () => {
    const res = await forgot("nobody@example.com");

    expect(res.status).toBe(200);
    expect(json(res).message).toBe("Если такой email зарегистрирован, на него отправлен код");
    expect(send).not.toHaveBeenCalled();
  });

  it("email нечувствителен к регистру и пробелам по краям", async () => {
    await forgot(" ANNA@EXAMPLE.com ");
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBe(EMAIL);
  });

  it("повторный запрос аннулирует предыдущий код", async () => {
    const first = await requestCode();
    const second = await requestCode();
    expect(second).not.toBe(first);

    expect((await reset({ code: first })).status).toBe(400);
    expect((await reset({ code: second })).status).toBe(200);
  });

  it("нет полей → 400", async () => {
    expect((await request(app).post("/api/auth/forgot-password").send({})).status).toBe(400);
  });
});

describe("POST /api/auth/reset-password", () => {
  it("верный код меняет пароль: старый больше не подходит, новый — работает", async () => {
    const code = await requestCode();

    const res = await reset({ code });

    expect(res.status).toBe(200);
    expect(json(res).message).toBe("Пароль успешно изменён");
    expect((await login("old-password1")).status).toBe(401);
    expect((await login("new-password1")).status).toBe(200);
  });

  it("использованный код повторно не работает", async () => {
    const code = await requestCode();
    await reset({ code });

    const res = await reset({ code });

    expect(res.status).toBe(400);
    expect(json(res).message).toBe("Неверный код");
  });

  it("неверный код → «Неверный код», пароль не меняется", async () => {
    await requestCode();

    const res = await reset({ code: "999999" });

    expect(res.status).toBe(400);
    expect(json(res).message).toBe("Неверный код");
    expect((await login("old-password1")).status).toBe(200);
  });

  it("без запроса кода — «Неверный код»", async () => {
    const res = await reset();
    expect(res.status).toBe(400);
    expect(json(res).message).toBe("Неверный код");
  });

  it("код чужого пользователя не подходит, даже если он числом совпал бы", async () => {
    await prisma.user.create({ data: { name: "Игорь", email: "igor@example.com", password: "x" } });
    const code = await requestCode("igor@example.com");

    const res = await reset({ code });

    expect(res.status).toBe(400);
    expect(json(res).message).toBe("Неверный код");
  });

  it("просроченный код → «Код устарел, запросите новый»", async () => {
    const code = await requestCode();
    await prisma.passwordResetCode.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await reset({ code });

    expect(res.status).toBe(400);
    expect(json(res).message).toBe("Код устарел, запросите новый");
  });

  it("после 5 неверных попыток код сгорает — верный код уже не подходит", async () => {
    const code = await requestCode();

    for (let i = 0; i < 5; i++) {
      expect((await reset({ code: "111111" })).status).toBe(400);
    }
    const res = await reset({ code });

    expect(res.status).toBe(400);
    expect(json(res).message).toBe("Код устарел, запросите новый");
  });

  it.each([
    ["нет email", { email: undefined }, "Введите email"],
    ["некорректный email", { email: "not-an-email" }, "Некорректный email"],
    ["код не из 6 цифр", { code: "123" }, "Неверный код"],
    ["код с буквами", { code: "12345a" }, "Неверный код"],
    [
      "короткий пароль",
      { password: "short1", confirmPassword: "short1" },
      "Пароль должен содержать минимум 8 символов",
    ],
    ["пароли не совпадают", { confirmPassword: "other-password" }, "Пароли не совпадают"],
  ])("%s → 400", async (_name, patch, expected) => {
    const res = await reset(patch);
    expect(res.status).toBe(400);
    expect(json(res).message).toBe(expected);
  });
});
