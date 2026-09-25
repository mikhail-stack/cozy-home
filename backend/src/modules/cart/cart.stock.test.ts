import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { signAccessToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";

// Корзина и остаток товара (Product.stock): нельзя взять больше, чем есть.
const app = createApp();

interface CartBody {
  items: { product: { name: string }; quantity: number }[];
  skipped?: string[];
  message: string;
}
const json = (res: request.Response) => res.body as CartBody;
const quantities = (res: request.Response) =>
  Object.fromEntries(json(res).items.map((item) => [item.product.name, item.quantity]));

let token: string;
const auth = (req: request.Test) => req.set("Authorization", `Bearer ${token}`);
const make = (name: string, stock: number | null, inStock = true) =>
  prisma.product.create({
    data: { name, description: "d", price: 100, category: "decor", stock, inStock },
  });
const add = (productId: string, quantity = 1) =>
  auth(request(app).post("/api/cart/items")).send({ productId, quantity });

beforeEach(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  const user = await prisma.user.create({
    data: { name: "a", email: "a@example.com", password: "hash" },
  });
  token = signAccessToken({ sub: user.id, role: "user" });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("добавление", () => {
  it("в пределах остатка — можно, ровно на весь остаток — тоже", async () => {
    const candle = await make("Свеча", 3);
    expect(quantities(await add(candle.id, 3))).toEqual({ Свеча: 3 });
  });

  it("сверх остатка → 409 с числом доступных штук, корзина не меняется", async () => {
    const candle = await make("Свеча", 3);

    const res = await add(candle.id, 4);

    expect(res.status).toBe(409);
    expect(json(res).message).toBe("В наличии только 3 шт.");
    expect(await prisma.cartItem.count()).toBe(0);
  });

  it("учитывает уже лежащее в корзине: 2 + 2 при остатке 3 → 409, остаётся 2", async () => {
    const candle = await make("Свеча", 3);
    await add(candle.id, 2);

    const res = await add(candle.id, 2);

    expect(res.status).toBe(409);
    const cart = await auth(request(app).get("/api/cart"));
    expect(quantities(cart)).toEqual({ Свеча: 2 });
  });

  it("остаток 0 → «нет в наличии», даже если inStock не сброшен", async () => {
    const empty = await make("Плед", 0, true);
    const res = await add(empty.id);
    expect(res.status).toBe(409);
    expect(json(res).message).toBe("Товара нет в наличии");
  });

  it("товар без учёта остатка (null) не ограничен остатком", async () => {
    const free = await make("Кружка", null);
    expect(quantities(await add(free.id, 50))).toEqual({ Кружка: 50 });
  });
});

describe("изменение количества", () => {
  it("нельзя поднять выше остатка, можно до него включительно", async () => {
    const candle = await make("Свеча", 5);
    await add(candle.id);

    const over = await auth(request(app).patch(`/api/cart/items/${candle.id}`)).send({
      quantity: 6,
    });
    const exact = await auth(request(app).patch(`/api/cart/items/${candle.id}`)).send({
      quantity: 5,
    });

    expect(over.status).toBe(409);
    expect(json(over).message).toBe("В наличии только 5 шт.");
    expect(quantities(exact)).toEqual({ Свеча: 5 });
  });

  it("если остаток упал ниже количества в корзине — уменьшить и убрать можно", async () => {
    const candle = await make("Свеча", 10);
    await add(candle.id, 8);
    await prisma.product.update({ where: { id: candle.id }, data: { stock: 2 } });

    const same = await auth(request(app).patch(`/api/cart/items/${candle.id}`)).send({
      quantity: 8,
    });
    const lower = await auth(request(app).patch(`/api/cart/items/${candle.id}`)).send({
      quantity: 6,
    });
    const up = await auth(request(app).patch(`/api/cart/items/${candle.id}`)).send({
      quantity: 7,
    });

    expect(same.status).toBe(200); // не увеличение — не блокируем
    expect(quantities(lower)).toEqual({ Свеча: 6 });
    expect(up.status).toBe(409); // а вот вырасти выше остатка уже нельзя
  });
});

describe("слияние гостевой корзины", () => {
  it("обрезает количество по остатку, а не отвергает вход", async () => {
    const candle = await make("Свеча", 3);

    const res = await auth(request(app).post("/api/cart/merge")).send({
      items: [{ productId: candle.id, quantity: 10 }],
    });

    expect(res.status).toBe(200);
    expect(quantities(res)).toEqual({ Свеча: 3 });
  });

  it("учитывает уже лежащее в корзине аккаунта", async () => {
    const candle = await make("Свеча", 4);
    await add(candle.id, 3);

    const res = await auth(request(app).post("/api/cart/merge")).send({
      items: [{ productId: candle.id, quantity: 3 }],
    });

    expect(quantities(res)).toEqual({ Свеча: 4 });
  });

  it("товар с нулевым остатком пропускается и попадает в skipped", async () => {
    const empty = await make("Плед", 0, true);
    const res = await auth(request(app).post("/api/cart/merge")).send({
      items: [{ productId: empty.id, quantity: 1 }],
    });

    expect(json(res).items).toEqual([]);
    expect(json(res).skipped).toEqual([empty.id]);
  });
});
