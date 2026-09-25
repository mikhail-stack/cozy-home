import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { signAccessToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";

// Интеграционные тесты на реальной БД. Сценарии — ТЗ, раздел 5 (корзина
// user хранится в БД; при входе гостевая сливается, количества суммируются).
const app = createApp();

interface CartBody {
  items: { product: { id: string; name: string }; quantity: number }[];
  skipped?: string[];
  message: string;
}
const json = (res: request.Response) => res.body as CartBody;
const quantities = (res: request.Response) =>
  Object.fromEntries(json(res).items.map((item) => [item.product.name, item.quantity]));

let tokenA: string;
let tokenB: string;
let userAId: string;
let candle: { id: string };
let plaid: { id: string };
let soldOut: { id: string };

const asUser = (token: string, req: request.Test) => req.set("Authorization", `Bearer ${token}`);
const asA = (req: request.Test) => asUser(tokenA, req);

const makeProduct = (name: string, inStock = true) =>
  prisma.product.create({
    data: { name, description: "d", price: 100, category: "decor", inStock },
  });

beforeEach(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const [a, b] = await Promise.all(
    ["a", "b"].map((name) =>
      prisma.user.create({ data: { name, email: `${name}@example.com`, password: "hash" } }),
    ),
  );
  userAId = a.id;
  tokenA = signAccessToken({ sub: a.id, role: "user" });
  tokenB = signAccessToken({ sub: b.id, role: "user" });

  candle = await makeProduct("Свеча");
  plaid = await makeProduct("Плед");
  soldOut = await makeProduct("Зеркало", false);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("доступ", () => {
  it.each([
    ["GET /", () => request(app).get("/api/cart")],
    ["DELETE /", () => request(app).delete("/api/cart")],
    ["POST /items", () => request(app).post("/api/cart/items")],
    ["PATCH /items/:id", () => request(app).patch("/api/cart/items/x")],
    ["DELETE /items/:id", () => request(app).delete("/api/cart/items/x")],
    ["POST /merge", () => request(app).post("/api/cart/merge")],
  ])("%s без токена → 401", async (_name, send) => {
    expect((await send()).status).toBe(401);
  });

  it("пользователь видит и меняет только свою корзину", async () => {
    await asA(request(app).post("/api/cart/items")).send({ productId: candle.id, quantity: 3 });

    const other = await asUser(tokenB, request(app).get("/api/cart"));
    expect(json(other).items).toEqual([]);

    // Удаление «своей» строки у B не задевает корзину A.
    await asUser(tokenB, request(app).delete(`/api/cart/items/${candle.id}`));
    await asUser(tokenB, request(app).delete("/api/cart"));
    expect(quantities(await asA(request(app).get("/api/cart")))).toEqual({ Свеча: 3 });
  });

  it("токен удалённого пользователя → 401, а не 500", async () => {
    await prisma.user.delete({ where: { id: userAId } });

    const res = await asA(request(app).post("/api/cart/items")).send({ productId: candle.id });

    expect(res.status).toBe(401);
    expect(json(res).message).toBe("Сессия истекла, войдите заново");
  });
});

describe("чтение и добавление", () => {
  it("пустая корзина", async () => {
    const res = await asA(request(app).get("/api/cart"));
    expect(res.status).toBe(200);
    expect(json(res).items).toEqual([]);
  });

  it("добавляет товар (по умолчанию 1 шт.), отдаёт товар целиком", async () => {
    const res = await asA(request(app).post("/api/cart/items")).send({ productId: candle.id });

    expect(res.status).toBe(200);
    expect(json(res).items).toMatchObject([
      { product: { id: candle.id, name: "Свеча" }, quantity: 1 },
    ]);
  });

  it("повторное добавление увеличивает количество, а не плодит строки", async () => {
    await asA(request(app).post("/api/cart/items")).send({ productId: candle.id, quantity: 2 });
    const res = await asA(request(app).post("/api/cart/items")).send({
      productId: candle.id,
      quantity: 3,
    });

    expect(json(res).items).toHaveLength(1);
    expect(quantities(res)).toEqual({ Свеча: 5 });
  });

  it("сумма не превышает 99 шт. на строку", async () => {
    await asA(request(app).post("/api/cart/items")).send({ productId: candle.id, quantity: 60 });
    const res = await asA(request(app).post("/api/cart/items")).send({
      productId: candle.id,
      quantity: 60,
    });

    expect(quantities(res)).toEqual({ Свеча: 99 });
  });

  it("несуществующий товар → 404, недоступный → 409", async () => {
    const missing = await asA(request(app).post("/api/cart/items")).send({ productId: "nope" });
    const out = await asA(request(app).post("/api/cart/items")).send({ productId: soldOut.id });

    expect(missing.status).toBe(404);
    expect(out.status).toBe(409);
    expect(json(out).message).toBe("Товара нет в наличии");
  });

  it.each([
    ["ноль", { quantity: 0 }, "Количество должно быть не меньше 1"],
    ["дробное", { quantity: 1.5 }, "Количество должно быть целым числом"],
    ["больше 99", { quantity: 100 }, "Не больше 99 штук одного товара"],
    ["строка", { quantity: "2" }, "Укажите количество"],
  ])("количество: %s → 400", async (_name, override, message) => {
    const res = await asA(request(app).post("/api/cart/items")).send({
      productId: candle.id,
      ...override,
    });

    expect(res.status).toBe(400);
    expect(json(res).message).toBe(message);
  });
});

describe("изменение и удаление", () => {
  beforeEach(async () => {
    await asA(request(app).post("/api/cart/items")).send({ productId: candle.id, quantity: 2 });
    await asA(request(app).post("/api/cart/items")).send({ productId: plaid.id });
  });

  it("задаёт точное количество", async () => {
    const res = await asA(request(app).patch(`/api/cart/items/${candle.id}`)).send({ quantity: 7 });
    expect(quantities(res)).toEqual({ Свеча: 7, Плед: 1 });
  });

  it("количество 0 убирает строку", async () => {
    const res = await asA(request(app).patch(`/api/cart/items/${candle.id}`)).send({ quantity: 0 });
    expect(quantities(res)).toEqual({ Плед: 1 });
  });

  it("товара нет в корзине → 404; отрицательное количество → 400", async () => {
    const absent = await asA(request(app).patch(`/api/cart/items/${soldOut.id}`)).send({
      quantity: 2,
    });
    const negative = await asA(request(app).patch(`/api/cart/items/${candle.id}`)).send({
      quantity: -1,
    });

    expect(absent.status).toBe(404);
    expect(negative.status).toBe(400);
  });

  it("товар, закончившийся пока лежал в корзине, можно уменьшить и убрать", async () => {
    await prisma.product.update({ where: { id: candle.id }, data: { inStock: false } });

    const decreased = await asA(request(app).patch(`/api/cart/items/${candle.id}`)).send({
      quantity: 1,
    });
    const removed = await asA(request(app).delete(`/api/cart/items/${candle.id}`));

    expect(decreased.status).toBe(200);
    expect(quantities(removed)).toEqual({ Плед: 1 });
  });

  it("удаление строки идемпотентно", async () => {
    await asA(request(app).delete(`/api/cart/items/${candle.id}`));
    const again = await asA(request(app).delete(`/api/cart/items/${candle.id}`));

    expect(again.status).toBe(200);
    expect(quantities(again)).toEqual({ Плед: 1 });
  });

  it("очистка корзины", async () => {
    const res = await asA(request(app).delete("/api/cart"));
    expect(json(res).items).toEqual([]);
    expect(await prisma.cartItem.count()).toBe(0);
  });
});

describe("слияние гостевой корзины при входе", () => {
  it("суммирует количества одинаковых товаров и добавляет новые (ТЗ, раздел 5)", async () => {
    await asA(request(app).post("/api/cart/items")).send({ productId: candle.id, quantity: 2 });

    const res = await asA(request(app).post("/api/cart/merge")).send({
      items: [
        { productId: candle.id, quantity: 3 },
        { productId: plaid.id, quantity: 1 },
      ],
    });

    expect(res.status).toBe(200);
    expect(quantities(res)).toEqual({ Свеча: 5, Плед: 1 });
    expect(json(res).skipped).toEqual([]);
  });

  it("в пустую корзину аккаунта переносит гостевую как есть", async () => {
    const res = await asA(request(app).post("/api/cart/merge")).send({
      items: [{ productId: plaid.id, quantity: 4 }],
    });
    expect(quantities(res)).toEqual({ Плед: 4 });
  });

  it("повторы в гостевой корзине суммируются, а потолок 99 не отвергает вход", async () => {
    const res = await asA(request(app).post("/api/cart/merge")).send({
      items: [
        { productId: candle.id, quantity: 70 },
        { productId: candle.id, quantity: 70 },
        { productId: plaid.id, quantity: 500 },
      ],
    });

    expect(res.status).toBe(200);
    expect(quantities(res)).toEqual({ Свеча: 99, Плед: 99 });
  });

  it("устаревшие строки (удалённый и недоступный товар) пропускаются, а не валят вход", async () => {
    const res = await asA(request(app).post("/api/cart/merge")).send({
      items: [
        { productId: candle.id, quantity: 1 },
        { productId: "удалён-давно", quantity: 2 },
        { productId: soldOut.id, quantity: 1 },
      ],
    });

    expect(res.status).toBe(200);
    expect(quantities(res)).toEqual({ Свеча: 1 });
    expect(json(res).skipped?.sort()).toEqual(["удалён-давно", soldOut.id].sort());
  });

  it("пустая гостевая корзина возвращает текущую корзину аккаунта", async () => {
    await asA(request(app).post("/api/cart/items")).send({ productId: candle.id });
    const res = await asA(request(app).post("/api/cart/merge")).send({ items: [] });
    expect(quantities(res)).toEqual({ Свеча: 1 });
  });

  it("слияние повторным вызовом не теряет и не ломает данные другого пользователя", async () => {
    await asUser(tokenB, request(app).post("/api/cart/items")).send({ productId: plaid.id });
    await asA(request(app).post("/api/cart/merge")).send({
      items: [{ productId: candle.id, quantity: 1 }],
    });

    expect(quantities(await asUser(tokenB, request(app).get("/api/cart")))).toEqual({ Плед: 1 });
  });

  it.each([
    ["нет items", {}],
    ["items не массив", { items: "x" }],
    ["дробное количество", { items: [{ productId: "p", quantity: 1.5 }] }],
    ["нулевое количество", { items: [{ productId: "p", quantity: 0 }] }],
    ["больше 100 позиций", { items: Array(101).fill({ productId: "p", quantity: 1 }) }],
  ])("некорректное тело (%s) → 400", async (_name, body) => {
    expect((await asA(request(app).post("/api/cart/merge")).send(body)).status).toBe(400);
  });
});
