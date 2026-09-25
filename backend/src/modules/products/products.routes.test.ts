import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../app.js";
import { signAccessToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";

// Cloudinary — внешний сервис: в тестах подменяем загрузку, остальное
// (Express, валидация, роли, БД) — настоящее.
vi.mock("../../lib/cloudinary.js", () => ({
  uploadImage: vi.fn((buffer: Buffer) =>
    Promise.resolve(`https://res.cloudinary.com/test/image-${buffer.length}.jpg`),
  ),
}));

const app = createApp();

interface ProductBody {
  id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  inStock: boolean;
  message: string;
}
const json = <T = ProductBody>(res: request.Response) => res.body as T;

const valid = {
  name: "Соевая свеча «Лаванда и ваниль»",
  description: "Ручная работа из соевого воска",
  price: 320,
  category: "candles",
};

let adminToken: string;
let userToken: string;

beforeEach(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: { name: "Админ", email: "admin@example.com", password: "hash", role: "admin" },
  });
  const user = await prisma.user.create({
    data: { name: "Анна", email: "anna@example.com", password: "hash" },
  });
  adminToken = signAccessToken({ sub: admin.id, role: "admin" });
  userToken = signAccessToken({ sub: user.id, role: "user" });
});

afterAll(async () => {
  await prisma.$disconnect();
});

const asAdmin = (req: request.Test) => req.set("Authorization", `Bearer ${adminToken}`);
const createProduct = async (overrides: Record<string, unknown> = {}) =>
  json(await asAdmin(request(app).post("/api/products")).send({ ...valid, ...overrides }));

describe("чтение — публичное", () => {
  it("список отдаёт все товары без авторизации, включая недоступные", async () => {
    await createProduct({ name: "А" });
    await createProduct({ name: "Б", inStock: false });

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(json<ProductBody[]>(res).map((p) => p.name)).toEqual(["А", "Б"]);
  });

  it("фильтрует по категории", async () => {
    await createProduct({ name: "Свеча", category: "candles" });
    await createProduct({ name: "Плед", category: "textile" });

    const res = await request(app).get("/api/products?category=textile");

    expect(json<ProductBody[]>(res).map((p) => p.name)).toEqual(["Плед"]);
  });

  it("неизвестная категория → 400, а не пустой список", async () => {
    expect((await request(app).get("/api/products?category=cars")).status).toBe(400);
  });

  it("товар по id; несуществующий → 404", async () => {
    const product = await createProduct();

    const found = await request(app).get(`/api/products/${product.id}`);
    const missing = await request(app).get("/api/products/nope");

    expect(found.status).toBe(200);
    expect(json(found).name).toBe(valid.name);
    expect(missing.status).toBe(404);
    expect(json(missing).message).toBe("Товар не найден");
  });
});

describe("изменение — только admin", () => {
  it.each([
    ["POST /", () => request(app).post("/api/products").send(valid)],
    ["PATCH /:id", () => request(app).patch("/api/products/x").send({ price: 1 })],
    ["DELETE /:id", () => request(app).delete("/api/products/x")],
    ["POST /upload", () => request(app).post("/api/products/upload")],
  ])("%s без токена → 401", async (_name, send) => {
    expect((await send()).status).toBe(401);
  });

  it("обычный пользователь → 403 и товар не создаётся", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${userToken}`)
      .send(valid);

    expect(res.status).toBe(403);
    expect(await prisma.product.count()).toBe(0);
  });
});

describe("создание", () => {
  it("создаёт товар со значениями по умолчанию (в наличии, без фото)", async () => {
    const res = await asAdmin(request(app).post("/api/products")).send(valid);

    expect(res.status).toBe(201);
    expect(json(res)).toMatchObject({ ...valid, inStock: true, images: [] });
  });

  it("принимает https-ссылки и пути от корня сайта", async () => {
    const images = ["https://res.cloudinary.com/x/a.jpg", "/products/soy-wax-main.avif"];
    expect((await createProduct({ images })).images).toEqual(images);
  });

  it.each([
    [
      "javascript-ссылка",
      { images: ["javascript:alert(1)"] },
      "Некорректная ссылка на изображение",
    ],
    ["http без s", { images: ["http://example.com/a.jpg"] }, "Некорректная ссылка на изображение"],
    ["дробная цена", { price: 99.5 }, "Цена должна быть целым числом"],
    ["нулевая цена", { price: 0 }, "Цена должна быть больше нуля"],
    ["цена строкой", { price: "320" }, "Введите цену"],
    ["пустое название", { name: "  " }, "Введите название"],
    ["неизвестная категория", { category: "cars" }, "Выберите категорию"],
    ["больше 10 фото", { images: Array(11).fill("/a.jpg") }, "Не больше 10 изображений"],
  ])("%s → 400", async (_name, override, message) => {
    const res = await asAdmin(request(app).post("/api/products")).send({ ...valid, ...override });

    expect(res.status).toBe(400);
    expect(json(res).message).toBe(message);
    expect(await prisma.product.count()).toBe(0);
  });
});

describe("правка", () => {
  it("меняет только переданные поля", async () => {
    const product = await createProduct({ images: ["/a.jpg"] });

    const res = await asAdmin(request(app).patch(`/api/products/${product.id}`)).send({
      price: 350,
      inStock: false,
    });

    expect(res.status).toBe(200);
    expect(json(res)).toMatchObject({
      price: 350,
      inStock: false,
      name: valid.name,
      images: ["/a.jpg"],
    });
  });

  it("пустое тело → 400 и данные не затираются значениями по умолчанию", async () => {
    const product = await createProduct({ images: ["/a.jpg"], inStock: false });

    const res = await asAdmin(request(app).patch(`/api/products/${product.id}`)).send({});
    const after = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });

    expect(res.status).toBe(400);
    expect(json(res).message).toBe("Нет полей для обновления");
    expect(after.images).toEqual(["/a.jpg"]);
    expect(after.inStock).toBe(false);
  });

  it("несуществующий id → 404", async () => {
    const res = await asAdmin(request(app).patch("/api/products/nope")).send({ price: 1 });
    expect(res.status).toBe(404);
  });
});

describe("удаление", () => {
  it("удаляет товар; повторное удаление → 404", async () => {
    const product = await createProduct();

    expect((await asAdmin(request(app).delete(`/api/products/${product.id}`))).status).toBe(204);
    expect((await asAdmin(request(app).delete(`/api/products/${product.id}`))).status).toBe(404);
  });

  it("товар из чьей-то корзины удаляется вместе со строкой корзины", async () => {
    const product = await createProduct();
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "anna@example.com" } });
    await prisma.cartItem.create({
      data: { userId: user.id, productId: product.id, quantity: 2 },
    });

    const res = await asAdmin(request(app).delete(`/api/products/${product.id}`));

    expect(res.status).toBe(204);
    expect(await prisma.cartItem.count()).toBe(0);
  });

  it("товар из истории заказов → 409, а корзины при отказе не теряются (транзакция)", async () => {
    const product = await createProduct();
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "anna@example.com" } });
    await prisma.cartItem.create({
      data: { userId: user.id, productId: product.id, quantity: 1 },
    });
    await prisma.order.create({
      data: {
        name: "Гость",
        phone: "+380",
        totalPrice: 320,
        items: { create: { productId: product.id, quantity: 1, price: 320 } },
      },
    });

    const res = await asAdmin(request(app).delete(`/api/products/${product.id}`));

    expect(res.status).toBe(409);
    expect(json(res).message).toBe("Товар есть в заказах — снимите его с наличия вместо удаления");
    expect(await prisma.product.count()).toBe(1);
    expect(await prisma.cartItem.count()).toBe(1);
  });
});

describe("загрузка изображений", () => {
  const jpeg = () => ({ filename: "a.jpg", contentType: "image/jpeg" });

  it("возвращает URL для каждого файла", async () => {
    const res = await asAdmin(request(app).post("/api/products/upload"))
      .attach("images", Buffer.alloc(3), jpeg())
      .attach("images", Buffer.alloc(5), jpeg());

    expect(res.status).toBe(200);
    expect(json<{ urls: string[] }>(res).urls).toEqual([
      "https://res.cloudinary.com/test/image-3.jpg",
      "https://res.cloudinary.com/test/image-5.jpg",
    ]);
  });

  it("без файлов → 400", async () => {
    const res = await asAdmin(request(app).post("/api/products/upload"));
    expect(res.status).toBe(400);
    expect(json(res).message).toBe("Выберите хотя бы один файл");
  });

  it("не изображение → 400", async () => {
    const res = await asAdmin(request(app).post("/api/products/upload")).attach(
      "images",
      Buffer.from("MZ"),
      { filename: "virus.exe", contentType: "application/x-msdownload" },
    );

    expect(res.status).toBe(400);
    expect(json(res).message).toBe("Разрешены только изображения");
  });

  it("файл больше 5 МБ → 400 с понятным текстом", async () => {
    const res = await asAdmin(request(app).post("/api/products/upload")).attach(
      "images",
      Buffer.alloc(5 * 1024 * 1024 + 1),
      jpeg(),
    );

    expect(res.status).toBe(400);
    expect(json(res).message).toBe("Файл слишком большой (максимум 5 МБ)");
  });
});
