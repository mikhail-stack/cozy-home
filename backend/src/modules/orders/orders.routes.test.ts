import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { signAccessToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";

// Интеграционные тесты на реальной БД. Сценарии — ТЗ, разделы 4.3 (форма
// заказа), 5 (заказ без регистрации), 9 (заказы в админке: фильтры, статусы).
const app = createApp();

interface OrderBody {
  id: string;
  number: number;
  name: string;
  phone: string;
  comment: string | null;
  status: string;
  totalPrice: number;
  userId: string | null;
  createdAt: string;
  items: { quantity: number; price: number; product: { id: string; name: string } }[];
  user?: { id: string; email: string } | null;
}
interface ListBody {
  orders: OrderBody[];
  total: number;
  page: number;
  limit: number;
}
const asOrder = (res: request.Response) => res.body as OrderBody;
const asList = (res: request.Response) => res.body as ListBody;
const message = (res: request.Response) => (res.body as { message: string }).message;
const numbers = (res: request.Response) => asList(res).orders.map((order) => order.number);

let userToken: string;
let otherToken: string;
let adminToken: string;
let userId: string;
let candle: { id: string };
let plaid: { id: string };
let soldOut: { id: string };

const auth = (token: string, req: request.Test) => req.set("Authorization", `Bearer ${token}`);
const asAdmin = (req: request.Test) => auth(adminToken, req);

const makeProduct = (name: string, price: number, inStock = true) =>
  prisma.product.create({
    data: { name, description: "d", price, category: "decor", inStock },
  });

const valid = () => ({
  name: "Анна Коваленко",
  phone: "+380 99 123 45 67",
  items: [{ productId: candle.id, quantity: 2 }],
});
const placeOrder = (body: object = valid()) => request(app).post("/api/orders").send(body);

beforeEach(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const [user, other] = await Promise.all(
    ["user", "other"].map((name) =>
      prisma.user.create({ data: { name, email: `${name}@example.com`, password: "hash" } }),
    ),
  );
  userId = user.id;
  userToken = signAccessToken({ sub: user.id, role: "user" });
  otherToken = signAccessToken({ sub: other.id, role: "user" });
  adminToken = signAccessToken({ sub: "admin-id", role: "admin" });

  candle = await makeProduct("Свеча", 320);
  plaid = await makeProduct("Плед", 1200);
  soldOut = await makeProduct("Зеркало", 1800, false);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("доступ", () => {
  it("гость может оформить заказ без токена", async () => {
    expect((await placeOrder()).status).toBe(201);
  });

  it.each([
    ["GET /my", () => request(app).get("/api/orders/my")],
    ["GET /", () => request(app).get("/api/orders")],
    ["GET /:id", () => request(app).get("/api/orders/x")],
    ["PATCH /:id/status", () => request(app).patch("/api/orders/x/status")],
  ])("%s без токена → 401", async (_name, send) => {
    expect((await send()).status).toBe(401);
  });

  it.each([
    ["GET /", () => auth(userToken, request(app).get("/api/orders"))],
    ["GET /:id", () => auth(userToken, request(app).get("/api/orders/x"))],
    ["PATCH /:id/status", () => auth(userToken, request(app).patch("/api/orders/x/status"))],
  ])("%s с ролью user → 403", async (_name, send) => {
    expect((await send()).status).toBe(403);
  });

  it("негодный токен при оформлении → 401, а не тихий «гость»", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", "Bearer broken")
      .send(valid());
    expect(res.status).toBe(401);
    expect(await prisma.order.count()).toBe(0);
  });
});

describe("POST /api/orders", () => {
  it("гость: заказ создаётся без userId, сумма и цены берутся из БД", async () => {
    const res = await placeOrder({
      ...valid(),
      comment: "Можно после 18:00",
      // Подделка с клиента — игнорируется.
      totalPrice: 1,
      items: [
        { productId: candle.id, quantity: 2, price: 1 },
        { productId: plaid.id, quantity: 1 },
      ],
    });

    expect(res.status).toBe(201);
    const order = asOrder(res);
    expect(order).toMatchObject({
      name: "Анна Коваленко",
      phone: "+380991234567",
      comment: "Можно после 18:00",
      status: "new",
      userId: null,
      totalPrice: 320 * 2 + 1200,
    });
    expect(Number.isInteger(order.number)).toBe(true);
    expect(order.items).toHaveLength(2);
    expect(order.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ quantity: 2, price: 320 }),
        expect.objectContaining({ quantity: 1, price: 1200 }),
      ]),
    );
  });

  it("пустой комментарий не сохраняется, пробелы в полях обрезаются", async () => {
    const res = await placeOrder({ ...valid(), name: "  Анна  ", comment: "   " });
    expect(asOrder(res)).toMatchObject({ name: "Анна", comment: null });
  });

  it("одинаковые товары в составе суммируются в одну строку", async () => {
    const res = await placeOrder({
      ...valid(),
      items: [
        { productId: candle.id, quantity: 1 },
        { productId: candle.id, quantity: 2 },
      ],
    });
    expect(asOrder(res).items).toMatchObject([{ quantity: 3, price: 320 }]);
    expect(asOrder(res).totalPrice).toBe(960);
  });

  it("номера заказов растут", async () => {
    const first = asOrder(await placeOrder());
    const second = asOrder(await placeOrder());
    expect(second.number).toBeGreaterThan(first.number);
  });

  it("цена в заказе — снимок: смена цены товара историю не меняет", async () => {
    const created = asOrder(await placeOrder());
    await prisma.product.update({ where: { id: candle.id }, data: { price: 999 } });

    const res = await asAdmin(request(app).get(`/api/orders/${created.id}`));
    expect(asOrder(res).items[0].price).toBe(320);
    expect(asOrder(res).totalPrice).toBe(640);
  });

  it("пользователь: заказ привязывается к аккаунту, серверная корзина очищается", async () => {
    await prisma.cartItem.createMany({
      data: [
        { userId, productId: candle.id, quantity: 2 },
        { userId, productId: plaid.id, quantity: 1 },
      ],
    });
    const other = await prisma.user.findUniqueOrThrow({ where: { email: "other@example.com" } });
    await prisma.cartItem.create({
      data: { userId: other.id, productId: candle.id, quantity: 5 },
    });

    const res = await auth(userToken, request(app).post("/api/orders")).send(valid());

    expect(res.status).toBe(201);
    expect(asOrder(res).userId).toBe(userId);
    expect(await prisma.cartItem.count({ where: { userId } })).toBe(0);
    // Корзина другого пользователя не тронута.
    expect(await prisma.cartItem.count({ where: { userId: other.id } })).toBe(1);
  });

  it("токен удалённого пользователя → 401, заказ не создан", async () => {
    await prisma.user.delete({ where: { id: userId } });

    const res = await auth(userToken, request(app).post("/api/orders")).send(valid());

    expect(res.status).toBe(401);
    expect(await prisma.order.count()).toBe(0);
  });

  it("неизвестный товар → 409, заказ не создан", async () => {
    const res = await placeOrder({ ...valid(), items: [{ productId: "nope", quantity: 1 }] });
    expect(res.status).toBe(409);
    expect(await prisma.order.count()).toBe(0);
  });

  it("товар снят с наличия → 409 с названием, заказ целиком не создаётся", async () => {
    const res = await placeOrder({
      ...valid(),
      items: [
        { productId: candle.id, quantity: 1 },
        { productId: soldOut.id, quantity: 1 },
      ],
    });
    expect(res.status).toBe(409);
    expect(message(res)).toBe("Товара «Зеркало» нет в наличии");
    expect(await prisma.order.count()).toBe(0);
  });

  describe("валидация", () => {
    it.each([
      ["нет имени", { name: " " }, "Введите имя"],
      ["нет телефона", { phone: "" }, "Введите телефон"],
      ["буквы в телефоне", { phone: "abc" }, "Введите корректный номер телефона"],
      ["слишком короткий телефон", { phone: "12345" }, "Введите корректный номер телефона"],
      [
        "слишком длинный телефон",
        { phone: "1234567890123456" },
        "Введите корректный номер телефона",
      ],
      ["пустая корзина", { items: [] }, "Корзина пуста"],
      ["корзина не передана", { items: undefined }, "Корзина пуста"],
      [
        "нулевое количество",
        { items: [{ productId: "x", quantity: 0 }] },
        "Количество должно быть не меньше 1",
      ],
      [
        "дробное количество",
        { items: [{ productId: "x", quantity: 1.5 }] },
        "Количество должно быть целым числом",
      ],
      [
        "количество больше 99",
        { items: [{ productId: "x", quantity: 100 }] },
        "Не больше 99 штук одного товара",
      ],
    ])("%s → 400", async (_name, patch, expected) => {
      const res = await placeOrder({ ...valid(), ...patch });
      expect(res.status).toBe(400);
      expect(message(res)).toBe(expected);
    });

    it("сумма одинаковых строк больше 99 → 400", async () => {
      const res = await placeOrder({
        ...valid(),
        items: [
          { productId: candle.id, quantity: 60 },
          { productId: candle.id, quantity: 60 },
        ],
      });
      expect(res.status).toBe(400);
      expect(message(res)).toBe("Не больше 99 штук одного товара");
    });

    it("телефон в разных форматах принимается", async () => {
      for (const phone of ["+380991234567", "(099) 123-45-67", "099.123.45.67"]) {
        expect((await placeOrder({ ...valid(), phone })).status).toBe(201);
      }
    });
  });
});

describe("GET /api/orders/my", () => {
  it("возвращает только свои заказы, новые первыми", async () => {
    const first = asOrder(await auth(userToken, request(app).post("/api/orders")).send(valid()));
    const second = asOrder(await auth(userToken, request(app).post("/api/orders")).send(valid()));
    await auth(otherToken, request(app).post("/api/orders")).send(valid());
    await placeOrder();

    const res = await auth(userToken, request(app).get("/api/orders/my"));

    expect(res.status).toBe(200);
    expect(asList(res).orders.map((order) => order.number)).toEqual([second.number, first.number]);
    expect(asList(res).orders[0].items[0].product.name).toBe("Свеча");
  });

  it("без заказов — пустой список", async () => {
    const res = await auth(userToken, request(app).get("/api/orders/my"));
    expect(asList(res).orders).toEqual([]);
  });
});

describe("GET /api/orders (админка)", () => {
  const seed = async () => {
    const day = (iso: string) => new Date(`${iso}T12:00:00.000Z`);
    const make = (
      name: string,
      phone: string,
      status: "new" | "processing" | "done" | "cancelled",
      createdAt: Date,
    ) =>
      prisma.order.create({
        data: { name, phone, status, createdAt, totalPrice: 100, userId: null },
      });
    return {
      anna: await make("Анна Коваленко", "+380991234567", "new", day("2026-08-29")),
      igor: await make("Игорь Петренко", "+380661112233", "processing", day("2026-08-24")),
      maria: await make("Мария Савчук", "+380672223344", "done", day("2026-08-24")),
      olga: await make("Ольга Романенко", "+380504445566", "cancelled", day("2026-08-20")),
    };
  };

  it("все заказы, новые первыми, с покупателем и составом", async () => {
    await placeOrder();
    await auth(userToken, request(app).post("/api/orders")).send(valid());

    const res = await asAdmin(request(app).get("/api/orders"));

    expect(res.status).toBe(200);
    expect(asList(res)).toMatchObject({ total: 2, page: 1, limit: 50 });
    const [latest, earliest] = asList(res).orders;
    expect(latest.number).toBeGreaterThan(earliest.number);
    expect(latest.user).toMatchObject({ id: userId, email: "user@example.com" });
    expect(earliest.user).toBeNull();
    expect(latest.items[0].product.name).toBe("Свеча");
  });

  it("фильтр по статусу", async () => {
    const orders = await seed();
    const res = await asAdmin(request(app).get("/api/orders?status=processing"));
    expect(numbers(res)).toEqual([orders.igor.number]);
  });

  it("поиск по имени — без учёта регистра и по части слова", async () => {
    const orders = await seed();
    const res = await asAdmin(request(app).get(`/api/orders?q=${encodeURIComponent("КОВАЛ")}`));
    expect(numbers(res)).toEqual([orders.anna.number]);
  });

  it("поиск по телефону", async () => {
    const orders = await seed();
    const res = await asAdmin(request(app).get("/api/orders?q=2223344"));
    expect(numbers(res)).toEqual([orders.maria.number]);
  });

  it("период: границы включительно", async () => {
    const orders = await seed();

    const single = await asAdmin(request(app).get("/api/orders?from=2026-08-24&to=2026-08-24"));
    expect(numbers(single).sort()).toEqual([orders.igor.number, orders.maria.number].sort());

    const from = await asAdmin(request(app).get("/api/orders?from=2026-08-25"));
    expect(numbers(from)).toEqual([orders.anna.number]);

    const to = await asAdmin(request(app).get("/api/orders?to=2026-08-20"));
    expect(numbers(to)).toEqual([orders.olga.number]);
  });

  it("фильтры комбинируются", async () => {
    const orders = await seed();
    const res = await asAdmin(
      request(app).get("/api/orders?status=done&from=2026-08-01&to=2026-08-31&q=савчук"),
    );
    expect(numbers(res)).toEqual([orders.maria.number]);
  });

  it("пустые параметры фильтра означают «не задан»", async () => {
    await seed();
    const res = await asAdmin(request(app).get("/api/orders?status=&from=&to=&q="));
    expect(asList(res).total).toBe(4);
  });

  it("пагинация: total считает все подходящие, страница — часть", async () => {
    await seed();
    const page1 = await asAdmin(request(app).get("/api/orders?limit=3"));
    const page2 = await asAdmin(request(app).get("/api/orders?limit=3&page=2"));

    expect(asList(page1)).toMatchObject({ total: 4, page: 1, limit: 3 });
    expect(asList(page1).orders).toHaveLength(3);
    expect(asList(page2).orders).toHaveLength(1);
  });

  it.each([
    ["status=unknown", "Недопустимый статус заказа"],
    ["from=29.08.2026", "Дата должна быть в формате ГГГГ-ММ-ДД"],
    ["to=2026-02-31", "Некорректная дата"],
    ["page=0", "Некорректная страница"],
    ["page=abc", "Некорректная страница"],
    ["limit=1000", "Не больше 100 заказов на странице"],
  ])("?%s → 400", async (query, expected) => {
    const res = await asAdmin(request(app).get(`/api/orders?${query}`));
    expect(res.status).toBe(400);
    expect(message(res)).toBe(expected);
  });
});

describe("GET /api/orders/:id", () => {
  it("детали заказа: покупатель, состав с товарами", async () => {
    const created = asOrder(await auth(userToken, request(app).post("/api/orders")).send(valid()));

    const res = await asAdmin(request(app).get(`/api/orders/${created.id}`));

    expect(res.status).toBe(200);
    expect(asOrder(res)).toMatchObject({
      number: created.number,
      user: { email: "user@example.com" },
      items: [{ quantity: 2, product: { name: "Свеча" } }],
    });
  });

  it("неизвестный id → 404", async () => {
    expect((await asAdmin(request(app).get("/api/orders/nope"))).status).toBe(404);
  });
});

describe("PATCH /api/orders/:id/status", () => {
  const patch = (id: string, body: object) =>
    asAdmin(request(app).patch(`/api/orders/${id}/status`)).send(body);

  it("меняет статус по цепочке новый → в обработке → выполнен", async () => {
    const { id } = asOrder(await placeOrder());

    expect(asOrder(await patch(id, { status: "processing" })).status).toBe("processing");
    expect(asOrder(await patch(id, { status: "done" })).status).toBe("done");
    expect((await prisma.order.findUniqueOrThrow({ where: { id } })).status).toBe("done");
  });

  it("повтор того же статуса — не ошибка", async () => {
    const { id } = asOrder(await placeOrder());
    expect((await patch(id, { status: "new" })).status).toBe(200);
  });

  it("недопустимый статус → 400", async () => {
    const { id } = asOrder(await placeOrder());
    const res = await patch(id, { status: "shipped" });
    expect(res.status).toBe(400);
    expect(message(res)).toBe("Недопустимый статус заказа");
  });

  it("неизвестный заказ → 404", async () => {
    expect((await patch("nope", { status: "done" })).status).toBe(404);
  });

  it("отменённый заказ изменить нельзя", async () => {
    const { id } = asOrder(await placeOrder());
    await patch(id, { status: "cancelled" });

    const res = await patch(id, { status: "processing" });
    expect(res.status).toBe(409);
    expect(message(res)).toBe("Отменённый заказ нельзя изменить");
  });

  it("выполненный заказ отменить нельзя", async () => {
    const { id } = asOrder(await placeOrder());
    await patch(id, { status: "done" });

    const res = await patch(id, { status: "cancelled" });
    expect(res.status).toBe(409);
    expect(message(res)).toBe("Выполненный заказ нельзя отменить");
  });
});
