import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { prisma } from "../../lib/prisma.js";

// Интеграционные тесты: реальное Express-приложение + тестовая БД, без
// моков — сценарии и тексты ошибок из docs/cozy-home-tz.md, раздел 6.
const app = createApp();

interface Body {
  user: { name: string; email: string; role: string };
  accessToken: string;
  message: string;
}
// res.body в supertest — any; приводим тип явно (конвенция проекта, CLAUDE.md).
const bodyOf = (res: request.Response) => res.body as Body;

const valid = {
  name: "Анна",
  email: "anna@example.com",
  password: "password123",
  confirmPassword: "password123",
};

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const refreshCookie = (res: request.Response) =>
  (res.headers["set-cookie"] as unknown as string[] | undefined)?.find((c) =>
    c.startsWith("refresh_token="),
  );

describe("POST /api/auth/register", () => {
  it("создаёт пользователя, выдаёт access-токен и httpOnly refresh-куку", async () => {
    const res = await request(app).post("/api/auth/register").send(valid);

    expect(res.status).toBe(201);
    expect(bodyOf(res).user).toMatchObject({
      name: "Анна",
      email: "anna@example.com",
      role: "user",
    });
    expect(typeof bodyOf(res).accessToken).toBe("string");
    expect(refreshCookie(res)).toMatch(/HttpOnly/i);
  });

  it("не хранит пароль открытым текстом и не возвращает его", async () => {
    const res = await request(app).post("/api/auth/register").send(valid);
    const stored = await prisma.user.findUniqueOrThrow({ where: { email: valid.email } });

    expect(stored.password).not.toBe(valid.password);
    expect(JSON.stringify(res.body)).not.toContain("password");
  });

  it("нормализует email (регистр и пробелы)", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ ...valid, email: "  ANNA@Example.com " });
    expect(await prisma.user.count({ where: { email: "anna@example.com" } })).toBe(1);
  });

  it("занятый email → 409 «Такой email уже зарегистрирован»", async () => {
    await request(app).post("/api/auth/register").send(valid);
    const res = await request(app).post("/api/auth/register").send(valid);

    expect(res.status).toBe(409);
    expect(bodyOf(res).message).toBe("Такой email уже зарегистрирован");
  });

  it.each([
    [
      "короткий пароль",
      { password: "short", confirmPassword: "short" },
      "Пароль должен содержать минимум 8 символов",
    ],
    ["разные пароли", { confirmPassword: "password124" }, "Пароли не совпадают"],
    ["невалидный email", { email: "not-an-email" }, "Некорректный email"],
    ["пустое имя", { name: "  " }, "Введите имя"],
  ])("%s → 400 с текстом из ТЗ", async (_name, override, message) => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...valid, ...override });

    expect(res.status).toBe(400);
    expect(bodyOf(res).message).toBe(message);
  });

  it("пустое тело → 400, а не 500", async () => {
    expect((await request(app).post("/api/auth/register")).status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(valid);
  });

  it("верные данные → user и access-токен", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: valid.email, password: valid.password });

    expect(res.status).toBe(200);
    expect(bodyOf(res).user.email).toBe(valid.email);
    expect(typeof bodyOf(res).accessToken).toBe("string");
  });

  it("неверный пароль и несуществующий email дают одинаковый ответ", async () => {
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: valid.email, password: "wrong-password" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: valid.password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(bodyOf(wrongPassword).message).toBe("Неверный email или пароль");
    expect(bodyOf(unknownEmail)).toEqual(bodyOf(wrongPassword));
  });

  it("«Запомнить меня» → постоянная кука, без него → сессионная", async () => {
    const remembered = await request(app)
      .post("/api/auth/login")
      .send({ email: valid.email, password: valid.password, rememberMe: true });
    const session = await request(app)
      .post("/api/auth/login")
      .send({ email: valid.email, password: valid.password });

    expect(refreshCookie(remembered)).toMatch(/Max-Age=2592000/); // 30 дней
    expect(refreshCookie(session)).not.toMatch(/Max-Age|Expires=(?!Thu, 01 Jan 1970)/);
  });
});

describe("сессия: refresh, me, logout", () => {
  it("refresh по куке возвращает нового пользователя и access-токен", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(valid);

    const res = await agent.post("/api/auth/refresh");

    expect(res.status).toBe(200);
    expect(bodyOf(res).user.email).toBe(valid.email);
    expect(typeof bodyOf(res).accessToken).toBe("string");
  });

  it("refresh без куки → 401", async () => {
    expect((await request(app).post("/api/auth/refresh")).status).toBe(401);
  });

  it("refresh для удалённого пользователя → 401", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(valid);
    await prisma.user.deleteMany();

    expect((await agent.post("/api/auth/refresh")).status).toBe(401);
  });

  it("GET /me: с токеном — пользователь, без — 401", async () => {
    const body = bodyOf(await request(app).post("/api/auth/register").send(valid));

    const ok = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${body.accessToken}`);
    const denied = await request(app).get("/api/auth/me");

    expect(ok.status).toBe(200);
    expect(bodyOf(ok).user.email).toBe(valid.email);
    expect(denied.status).toBe(401);
  });

  it("logout очищает refresh-куку, после чего refresh даёт 401", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(valid);

    const res = await agent.post("/api/auth/logout");

    expect(res.status).toBe(204);
    expect(refreshCookie(res)).toMatch(/refresh_token=;/);
    expect((await agent.post("/api/auth/refresh")).status).toBe(401);
  });
});

describe("прочее", () => {
  it("неизвестный роут → 404 в формате { message }", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(bodyOf(res).message).toBe("Не найдено");
  });
});
