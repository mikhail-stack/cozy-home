import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { signAccessToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";

// Остаток товара через API админки (Product.stock, см. schema.prisma).
const app = createApp();

interface ProductBody {
  id: string;
  stock: number | null;
  inStock: boolean;
  message: string;
}
const json = (res: request.Response) => res.body as ProductBody;

const valid = { name: "Свеча", description: "d", price: 320, category: "candles" };
let adminToken: string;

beforeEach(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  const admin = await prisma.user.create({
    data: { name: "A", email: "admin@example.com", password: "hash", role: "admin" },
  });
  adminToken = signAccessToken({ sub: admin.id, role: "admin" });
});

afterAll(async () => {
  await prisma.$disconnect();
});

const post = (body: object) =>
  request(app).post("/api/products").set("Authorization", `Bearer ${adminToken}`).send(body);
const patch = (id: string, body: object) =>
  request(app).patch(`/api/products/${id}`).set("Authorization", `Bearer ${adminToken}`).send(body);

describe("создание с остатком", () => {
  it("без остатка — учёт выключен (stock null), inStock как передан", async () => {
    const res = await post({ ...valid, inStock: false });
    expect(json(res)).toMatchObject({ stock: null, inStock: false });
  });

  it("с остатком — inStock выводится из него", async () => {
    expect(json(await post({ ...valid, stock: 5 }))).toMatchObject({ stock: 5, inStock: true });
    expect(json(await post({ ...valid, stock: 0 }))).toMatchObject({ stock: 0, inStock: false });
  });

  it("остаток главнее переданного inStock", async () => {
    const res = await post({ ...valid, stock: 0, inStock: true });
    expect(json(res).inStock).toBe(false);
  });

  it.each([
    ["отрицательный", -1, "Остаток не может быть отрицательным"],
    ["дробный", 1.5, "Остаток должен быть целым числом"],
    ["строкой", "5", "Остаток должен быть числом"],
    ["слишком большой", 100001, "Слишком большой остаток"],
  ])("остаток %s → 400", async (_name, stock, message) => {
    const res = await post({ ...valid, stock });
    expect(res.status).toBe(400);
    expect(json(res).message).toBe(message);
  });
});

describe("правка остатка", () => {
  it("обнуление снимает товар с наличия, пополнение возвращает", async () => {
    const { id } = json(await post({ ...valid, stock: 5 }));

    expect(json(await patch(id, { stock: 0 }))).toMatchObject({ stock: 0, inStock: false });
    expect(json(await patch(id, { stock: 10 }))).toMatchObject({ stock: 10, inStock: true });
  });

  it("stock: null выключает учёт, не трогая inStock", async () => {
    const { id } = json(await post({ ...valid, stock: 5 }));

    const res = await patch(id, { stock: null });

    expect(res.status).toBe(200);
    expect(json(res)).toMatchObject({ stock: null, inStock: true });
  });

  it("правка других полей не сбрасывает остаток", async () => {
    const { id } = json(await post({ ...valid, stock: 7 }));
    expect(json(await patch(id, { price: 400 }))).toMatchObject({ stock: 7, inStock: true });
  });

  it("остаток виден в публичном списке (фронту нужен, чтобы ограничить степпер)", async () => {
    await post({ ...valid, stock: 4 });
    const res = await request(app).get("/api/products");
    expect((res.body as ProductBody[])[0]).toMatchObject({ stock: 4 });
  });
});
