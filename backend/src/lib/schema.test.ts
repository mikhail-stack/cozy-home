import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma.js";

// Интеграционные тесты инвариантов схемы на реальной тестовой БД
// (см. test/global-setup.ts): уникальность, значения по умолчанию,
// каскады и RESTRICT. Логики приложения тут нет — проверяем, что
// база сама не даёт нарушить правила из ТЗ (разделы 5, 11) и
// docs/architecture.md (раздел 4).
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

const makeUser = (email = "anna@example.com") =>
  prisma.user.create({ data: { name: "Анна", email, password: "hash" } });

const makeProduct = () =>
  prisma.product.create({
    data: { name: "Свеча", description: "Соевая", price: 320, category: "candles" },
  });

describe("значения по умолчанию", () => {
  it("роль пользователя — user, товар в наличии, заказ — new", async () => {
    const user = await makeUser();
    const product = await makeProduct();
    const order = await prisma.order.create({
      data: { name: "Гость", phone: "+380", totalPrice: 320 },
    });

    expect(user.role).toBe("user");
    expect(product.inStock).toBe(true);
    expect(order.status).toBe("new");
    expect(order.userId).toBeNull();
  });
});

describe("уникальность", () => {
  it("не даёт создать двух пользователей с одним email", async () => {
    await makeUser("dup@example.com");
    await expect(makeUser("dup@example.com")).rejects.toThrow();
  });

  it("не даёт завести две строки корзины на одну пару пользователь+товар", async () => {
    const user = await makeUser();
    const product = await makeProduct();
    const data = { userId: user.id, productId: product.id, quantity: 1 };

    await prisma.cartItem.create({ data });
    await expect(prisma.cartItem.create({ data })).rejects.toThrow();
  });
});

describe("каскады и ограничения", () => {
  it("удаление заказа удаляет его позиции", async () => {
    const product = await makeProduct();
    const order = await prisma.order.create({
      data: {
        name: "Гость",
        phone: "+380",
        totalPrice: 640,
        items: { create: { productId: product.id, quantity: 2, price: 320 } },
      },
    });

    await prisma.order.delete({ where: { id: order.id } });
    expect(await prisma.orderItem.count()).toBe(0);
  });

  it("удаление пользователя чистит его корзину, но сохраняет заказы (userId → null)", async () => {
    const user = await makeUser();
    const product = await makeProduct();
    await prisma.cartItem.create({
      data: { userId: user.id, productId: product.id, quantity: 1 },
    });
    const order = await prisma.order.create({
      data: { name: "Анна", phone: "+380", totalPrice: 320, userId: user.id },
    });

    await prisma.user.delete({ where: { id: user.id } });

    expect(await prisma.cartItem.count()).toBe(0);
    const kept = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(kept.userId).toBeNull();
  });

  it("не даёт удалить товар, который есть в истории заказов", async () => {
    const product = await makeProduct();
    await prisma.order.create({
      data: {
        name: "Гость",
        phone: "+380",
        totalPrice: 320,
        items: { create: { productId: product.id, quantity: 1, price: 320 } },
      },
    });

    await expect(prisma.product.delete({ where: { id: product.id } })).rejects.toThrow();
  });
});
