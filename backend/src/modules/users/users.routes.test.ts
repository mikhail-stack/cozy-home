import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { signAccessToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";

// Интеграционные тесты на реальной БД. Сценарии — ТЗ, раздел 9 («Пользователи»:
// таблица Имя / Email / Telegram / Роль / Дата регистрации, действия — сменить
// роль, удалить пользователя).
const app = createApp();

interface UserBody {
  id: string;
  name: string;
  email: string;
  telegramChatId: string | null;
  role: string;
  createdAt: string;
  password?: string;
}
interface ListBody {
  users: UserBody[];
  total: number;
  page: number;
  limit: number;
  message: string;
}
const asList = (res: request.Response) => res.body as ListBody;
const asUser = (res: request.Response) => res.body as UserBody & { message: string };
const message = (res: request.Response) => (res.body as { message: string }).message;
const names = (res: request.Response) => asList(res).users.map((user) => user.name);

let admin: { id: string };
let otherAdmin: { id: string };
let anna: { id: string };
let igor: { id: string };
let adminToken: string;
let otherAdminToken: string;
let userToken: string;

const bearer = (token: string, req: request.Test) => req.set("Authorization", `Bearer ${token}`);
const list = (query = "") => bearer(adminToken, request(app).get(`/api/users${query}`));
const setRole = (id: string, role: unknown, token = adminToken) =>
  bearer(token, request(app).patch(`/api/users/${id}/role`)).send({ role });
const remove = (id: string, token = adminToken) =>
  bearer(token, request(app).delete(`/api/users/${id}`));

const makeUser = (
  name: string,
  data: { role?: "user" | "admin"; telegramChatId?: string; createdAt?: Date } = {},
) =>
  prisma.user.create({
    data: { name, email: `${name.toLowerCase()}@example.com`, password: "secret-hash", ...data },
  });

beforeEach(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const day = (iso: string) => new Date(`${iso}T12:00:00.000Z`);
  admin = await makeUser("Admin", { role: "admin", createdAt: day("2026-08-01") });
  otherAdmin = await makeUser("Boss", { role: "admin", createdAt: day("2026-08-02") });
  anna = await makeUser("Anna", { createdAt: day("2026-08-29"), telegramChatId: "12345" });
  igor = await makeUser("Igor", { createdAt: day("2026-08-15") });

  adminToken = signAccessToken({ sub: admin.id, role: "admin" });
  otherAdminToken = signAccessToken({ sub: otherAdmin.id, role: "admin" });
  userToken = signAccessToken({ sub: anna.id, role: "user" });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("доступ", () => {
  it.each([
    ["GET /", () => request(app).get("/api/users")],
    ["PATCH /:id/role", () => request(app).patch("/api/users/x/role")],
    ["DELETE /:id", () => request(app).delete("/api/users/x")],
  ])("%s без токена → 401", async (_name, send) => {
    expect((await send()).status).toBe(401);
  });

  it.each([
    ["GET /", () => bearer(userToken, request(app).get("/api/users"))],
    ["PATCH /:id/role", () => bearer(userToken, request(app).patch("/api/users/x/role"))],
    ["DELETE /:id", () => bearer(userToken, request(app).delete("/api/users/x"))],
  ])("%s с ролью user → 403", async (_name, send) => {
    expect((await send()).status).toBe(403);
  });

  it("обычный пользователь не может повысить себя или удалить другого", async () => {
    expect((await setRole(anna.id, "admin", userToken)).status).toBe(403);
    expect((await remove(igor.id, userToken)).status).toBe(403);
    expect(await prisma.user.count()).toBe(4);
  });
});

describe("GET /api/users", () => {
  it("колонки из ТЗ, новые регистрации первыми, хеш пароля не отдаётся", async () => {
    const res = await list();

    expect(res.status).toBe(200);
    expect(asList(res)).toMatchObject({ total: 4, page: 1, limit: 50 });
    expect(names(res)).toEqual(["Anna", "Igor", "Boss", "Admin"]);
    expect(asList(res).users[0]).toEqual({
      id: anna.id,
      name: "Anna",
      email: "anna@example.com",
      telegramChatId: "12345",
      role: "user",
      createdAt: "2026-08-29T12:00:00.000Z",
    });
    expect(JSON.stringify(res.body)).not.toContain("secret-hash");
    expect(asList(res).users.every((user) => !("password" in user))).toBe(true);
  });

  it("поиск по имени и по email, без учёта регистра", async () => {
    expect(names(await list(`?q=${encodeURIComponent("ANN")}`))).toEqual(["Anna"]);
    expect(names(await list("?q=igor@example"))).toEqual(["Igor"]);
    expect(names(await list("?q=nobody"))).toEqual([]);
  });

  it("пустой q означает «без фильтра»", async () => {
    expect(asList(await list("?q=")).total).toBe(4);
  });

  it("пагинация", async () => {
    const page1 = await list("?limit=3");
    const page2 = await list("?limit=3&page=2");

    expect(asList(page1)).toMatchObject({ total: 4, page: 1, limit: 3 });
    expect(asList(page1).users).toHaveLength(3);
    expect(names(page2)).toEqual(["Admin"]);
  });

  it.each([
    ["page=0", "Некорректная страница"],
    ["page=abc", "Некорректная страница"],
    ["limit=1000", "Не больше 100 пользователей на странице"],
  ])("?%s → 400", async (query, expected) => {
    const res = await list(`?${query}`);
    expect(res.status).toBe(400);
    expect(message(res)).toBe(expected);
  });
});

describe("PATCH /api/users/:id/role", () => {
  it("повышает user → admin и понижает admin → user", async () => {
    const up = await setRole(igor.id, "admin");
    expect(up.status).toBe(200);
    expect(asUser(up)).toMatchObject({ id: igor.id, role: "admin", email: "igor@example.com" });
    expect(asUser(up).password).toBeUndefined();

    const down = await setRole(igor.id, "user");
    expect(asUser(down).role).toBe("user");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: igor.id } })).role).toBe("user");
  });

  it("повтор той же роли — не ошибка", async () => {
    expect((await setRole(igor.id, "user")).status).toBe(200);
  });

  it.each([["superuser"], [""], [undefined], [42]])("роль %j → 400", async (role) => {
    const res = await setRole(igor.id, role);
    expect(res.status).toBe(400);
    expect(message(res)).toBe("Недопустимая роль");
  });

  it("неизвестный пользователь → 404", async () => {
    expect((await setRole("nope", "admin")).status).toBe(404);
  });

  it("свою роль менять нельзя", async () => {
    const res = await setRole(admin.id, "user");

    expect(res.status).toBe(409);
    expect(message(res)).toBe("Нельзя изменить собственную роль");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: admin.id } })).role).toBe("admin");
  });

  it("нельзя лишить прав последнего администратора (например, токен уже разжалованного админа)", async () => {
    await prisma.user.update({ where: { id: otherAdmin.id }, data: { role: "user" } });

    // otherAdmin (в БД уже user, но токен ещё «admin») пытается разжаловать единственного админа.
    const res = await setRole(admin.id, "user", otherAdminToken);

    expect(res.status).toBe(409);
    expect(message(res)).toBe("Нельзя лишить прав последнего администратора");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: admin.id } })).role).toBe("admin");
  });

  it("два админа, одновременно разжалующие друг друга: остаётся один", async () => {
    const [a, b] = await Promise.all([
      setRole(otherAdmin.id, "user", adminToken),
      setRole(admin.id, "user", otherAdminToken),
    ]);

    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect(await prisma.user.count({ where: { role: "admin" } })).toBe(1);
  });
});

describe("DELETE /api/users/:id", () => {
  it("удаляет пользователя вместе с его корзиной", async () => {
    const product = await prisma.product.create({
      data: { name: "Свеча", description: "d", price: 100, category: "decor" },
    });
    await prisma.cartItem.create({
      data: { userId: igor.id, productId: product.id, quantity: 2 },
    });

    const res = await remove(igor.id);

    expect(res.status).toBe(204);
    expect(await prisma.user.findUnique({ where: { id: igor.id } })).toBeNull();
    expect(await prisma.cartItem.count()).toBe(0);
    expect(await prisma.product.count()).toBe(1);
  });

  it("заказы удалённого пользователя остаются в истории магазина, но без привязки к аккаунту", async () => {
    const product = await prisma.product.create({
      data: { name: "Свеча", description: "d", price: 100, category: "decor" },
    });
    const order = await prisma.order.create({
      data: {
        name: "Игорь",
        phone: "+380661112233",
        totalPrice: 200,
        userId: igor.id,
        items: { create: [{ productId: product.id, quantity: 2, price: 100 }] },
      },
    });

    const res = await remove(igor.id);

    expect(res.status).toBe(204);
    const kept = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });
    expect(kept).toMatchObject({ userId: null, name: "Игорь", phone: "+380661112233" });
    expect(kept.items).toHaveLength(1);
  });

  it("чужие заказы и корзины не затрагиваются", async () => {
    const product = await prisma.product.create({
      data: { name: "Свеча", description: "d", price: 100, category: "decor" },
    });
    await prisma.cartItem.create({
      data: { userId: anna.id, productId: product.id, quantity: 1 },
    });
    await prisma.order.create({
      data: { name: "Анна", phone: "+380501234567", totalPrice: 100, userId: anna.id },
    });

    await remove(igor.id);

    expect(await prisma.cartItem.count({ where: { userId: anna.id } })).toBe(1);
    expect(await prisma.order.count({ where: { userId: anna.id } })).toBe(1);
  });

  it("можно удалить админа, если есть другой", async () => {
    expect((await remove(otherAdmin.id)).status).toBe(204);
    expect(await prisma.user.count({ where: { role: "admin" } })).toBe(1);
  });

  it("неизвестный пользователь → 404", async () => {
    expect((await remove("nope")).status).toBe(404);
  });

  it("себя удалить нельзя", async () => {
    const res = await remove(admin.id);

    expect(res.status).toBe(409);
    expect(message(res)).toBe("Нельзя удалить самого себя");
    expect(await prisma.user.count()).toBe(4);
  });

  it("нельзя удалить последнего администратора", async () => {
    await prisma.user.update({ where: { id: otherAdmin.id }, data: { role: "user" } });

    const res = await remove(admin.id, otherAdminToken);

    expect(res.status).toBe(409);
    expect(message(res)).toBe("Нельзя удалить последнего администратора");
    expect(await prisma.user.findUnique({ where: { id: admin.id } })).not.toBeNull();
  });

  it("два админа, одновременно удаляющие друг друга: остаётся один", async () => {
    const [a, b] = await Promise.all([
      remove(otherAdmin.id, adminToken),
      remove(admin.id, otherAdminToken),
    ]);

    expect([a.status, b.status].sort()).toEqual([204, 409]);
    expect(await prisma.user.count({ where: { role: "admin" } })).toBe(1);
  });
});
