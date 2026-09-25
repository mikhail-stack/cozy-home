import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { signAccessToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";

// Списание остатка при заказе и его возврат при отмене (docs/plan.md,
// пункт 18; правила остатка — products/stock.ts).
const app = createApp();

const adminToken = signAccessToken({ sub: "admin-id", role: "admin" });
const message = (res: request.Response) => (res.body as { message: string }).message;
const orderId = (res: request.Response) => (res.body as { id: string }).id;

const makeProduct = (name: string, data: { stock?: number | null; inStock?: boolean } = {}) =>
  prisma.product.create({
    data: { name, description: "d", price: 100, category: "decor", ...data },
  });
const order = (items: { productId: string; quantity: number }[]) =>
  request(app).post("/api/orders").send({ name: "Анна", phone: "+380991234567", items });
const setStatus = (id: string, status: string) =>
  request(app)
    .patch(`/api/orders/${id}/status`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ status });
const reload = (id: string) => prisma.product.findUniqueOrThrow({ where: { id } });

beforeEach(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("списание остатка при заказе", () => {
  it("уменьшает остаток на заказанное количество", async () => {
    const candle = await makeProduct("Свеча", { stock: 10 });

    const res = await order([{ productId: candle.id, quantity: 4 }]);

    expect(res.status).toBe(201);
    expect(await reload(candle.id)).toMatchObject({ stock: 6, inStock: true });
  });

  it("обнулённый остаток снимает товар с наличия", async () => {
    const candle = await makeProduct("Свеча", { stock: 3 });

    await order([{ productId: candle.id, quantity: 3 }]);

    expect(await reload(candle.id)).toMatchObject({ stock: 0, inStock: false });
    // И следующий заказ отклоняется.
    const next = await order([{ productId: candle.id, quantity: 1 }]);
    expect(next.status).toBe(409);
    expect(message(next)).toBe("Товара «Свеча» нет в наличии");
  });

  it("товар без учёта остатка (stock = null) не списывается", async () => {
    const plaid = await makeProduct("Плед", { stock: null });

    await order([{ productId: plaid.id, quantity: 5 }]);

    expect(await reload(plaid.id)).toMatchObject({ stock: null, inStock: true });
  });

  it("нехватка остатка → 409 с числом доступных штук, ничего не списано", async () => {
    const candle = await makeProduct("Свеча", { stock: 2 });

    const res = await order([{ productId: candle.id, quantity: 3 }]);

    expect(res.status).toBe(409);
    expect(message(res)).toBe("Товара «Свеча» в наличии только 2 шт.");
    expect(await reload(candle.id)).toMatchObject({ stock: 2, inStock: true });
    expect(await prisma.order.count()).toBe(0);
  });

  it("если не хватает одного из товаров, списания по остальным откатываются", async () => {
    const plenty = await makeProduct("Плед", { stock: 10 });
    const scarce = await makeProduct("Свеча", { stock: 1 });

    const res = await order([
      { productId: plenty.id, quantity: 4 },
      { productId: scarce.id, quantity: 2 },
    ]);

    expect(res.status).toBe(409);
    expect(await reload(plenty.id)).toMatchObject({ stock: 10 });
    expect(await reload(scarce.id)).toMatchObject({ stock: 1 });
    expect(await prisma.order.count()).toBe(0);
  });

  it("одинаковые строки суммируются до проверки остатка", async () => {
    const candle = await makeProduct("Свеча", { stock: 3 });

    const res = await order([
      { productId: candle.id, quantity: 2 },
      { productId: candle.id, quantity: 2 },
    ]);

    expect(res.status).toBe(409);
    expect(message(res)).toBe("Товара «Свеча» в наличии только 3 шт.");
  });

  it("параллельные заказы на последние штуки не уходят в минус", async () => {
    const candle = await makeProduct("Свеча", { stock: 3 });

    const results = await Promise.all(
      Array.from({ length: 8 }, () => order([{ productId: candle.id, quantity: 1 }])),
    );

    const statuses = results.map((res) => res.status).sort();
    expect(statuses.filter((status) => status === 201)).toHaveLength(3);
    expect(statuses.filter((status) => status === 409)).toHaveLength(5);
    expect(await reload(candle.id)).toMatchObject({ stock: 0, inStock: false });
    expect(await prisma.order.count()).toBe(3);
  });

  it("параллельные заказы с пересекающимися товарами не блокируют друг друга", async () => {
    const a = await makeProduct("А", { stock: 20 });
    const b = await makeProduct("Б", { stock: 20 });

    const results = await Promise.all([
      ...Array.from({ length: 5 }, () =>
        order([
          { productId: a.id, quantity: 1 },
          { productId: b.id, quantity: 1 },
        ]),
      ),
      ...Array.from({ length: 5 }, () =>
        order([
          { productId: b.id, quantity: 1 },
          { productId: a.id, quantity: 1 },
        ]),
      ),
    ]);

    expect(results.every((res) => res.status === 201)).toBe(true);
    expect(await reload(a.id)).toMatchObject({ stock: 10 });
    expect(await reload(b.id)).toMatchObject({ stock: 10 });
  });
});

describe("возврат остатка при отмене", () => {
  it("отмена возвращает остаток и снова включает наличие", async () => {
    const candle = await makeProduct("Свеча", { stock: 3 });
    const res = await order([{ productId: candle.id, quantity: 3 }]);
    expect(await reload(candle.id)).toMatchObject({ stock: 0, inStock: false });

    const cancelled = await setStatus(orderId(res), "cancelled");

    expect(cancelled.status).toBe(200);
    expect(await reload(candle.id)).toMatchObject({ stock: 3, inStock: true });
  });

  it("частичный остаток: возвращается ровно заказанное", async () => {
    const candle = await makeProduct("Свеча", { stock: 10 });
    const first = await order([{ productId: candle.id, quantity: 2 }]);
    await order([{ productId: candle.id, quantity: 5 }]);

    await setStatus(orderId(first), "cancelled");

    expect(await reload(candle.id)).toMatchObject({ stock: 5 });
  });

  it("товар без учёта остатка при отмене не получает остаток", async () => {
    const plaid = await makeProduct("Плед", { stock: null });
    const res = await order([{ productId: plaid.id, quantity: 2 }]);

    await setStatus(orderId(res), "cancelled");

    expect(await reload(plaid.id)).toMatchObject({ stock: null, inStock: true });
  });

  it("повторная и параллельные отмены возвращают остаток один раз", async () => {
    const candle = await makeProduct("Свеча", { stock: 10 });
    const res = await order([{ productId: candle.id, quantity: 4 }]);
    const id = orderId(res);

    await Promise.all([setStatus(id, "cancelled"), setStatus(id, "cancelled")]);
    await setStatus(id, "cancelled");

    expect(await reload(candle.id)).toMatchObject({ stock: 10 });
  });

  it("другие статусы остаток не трогают", async () => {
    const candle = await makeProduct("Свеча", { stock: 10 });
    const res = await order([{ productId: candle.id, quantity: 4 }]);

    await setStatus(orderId(res), "processing");
    await setStatus(orderId(res), "done");

    expect(await reload(candle.id)).toMatchObject({ stock: 6 });
  });

  it("отмена не откатывает остаток, если заказ выполнен (отмена запрещена)", async () => {
    const candle = await makeProduct("Свеча", { stock: 10 });
    const res = await order([{ productId: candle.id, quantity: 4 }]);
    await setStatus(orderId(res), "done");

    expect((await setStatus(orderId(res), "cancelled")).status).toBe(409);
    expect(await reload(candle.id)).toMatchObject({ stock: 6 });
  });
});
