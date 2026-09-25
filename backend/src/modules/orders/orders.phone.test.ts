import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { signAccessToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";

// Телефон хранится в одном виде +380XXXXXXXXX независимо от того, как его
// ввели (решение из чата: только украинские номера).
const app = createApp();
const adminToken = signAccessToken({ sub: "admin-id", role: "admin" });

interface Body {
  phone: string;
  message: string;
  orders: { phone: string }[];
}
const json = (res: request.Response) => res.body as Body;

let productId: string;

const order = (phone: string) =>
  request(app)
    .post("/api/orders")
    .send({ name: "Анна", phone, items: [{ productId, quantity: 1 }] });
const search = (q: string) =>
  request(app)
    .get(`/api/orders?q=${encodeURIComponent(q)}`)
    .set("Authorization", `Bearer ${adminToken}`);

beforeEach(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  productId = (
    await prisma.product.create({
      data: { name: "Свеча", description: "d", price: 100, category: "decor" },
    })
  ).id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("телефон в заказе", () => {
  it.each(["+380501234567", "0501234567", "380501234567", "+38 (050) 123-45-67"])(
    "%s сохраняется как +380501234567",
    async (input) => {
      const res = await order(input);

      expect(res.status).toBe(201);
      expect(json(res).phone).toBe("+380501234567");
      expect((await prisma.order.findFirstOrThrow()).phone).toBe("+380501234567");
    },
  );

  it.each(["+48501234567", "0201234567", "050123456", "abc"])("%s → 400", async (input) => {
    const res = await order(input);

    expect(res.status).toBe(400);
    expect(json(res).message).toBe("Введите корректный номер телефона");
    expect(await prisma.order.count()).toBe(0);
  });
});

describe("поиск по телефону в админке", () => {
  it.each([
    "0501234567",
    "050 123 45 67",
    "(050) 123",
    "+380501234567",
    "+38 050 123",
    "501234567",
    "1234567",
  ])("запрос «%s» находит заказ", async (q) => {
    await order("0501234567");
    await order("0671112233");

    const res = await search(q);

    expect(res.status).toBe(200);
    expect(json(res).orders.map((found) => found.phone)).toEqual(["+380501234567"]);
  });

  it("запрос из одних нулей и скобок не ломает поиск", async () => {
    await order("0501234567");
    expect((await search("0")).status).toBe(200);
    expect((await search("()")).status).toBe(200);
  });
});
