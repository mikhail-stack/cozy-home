import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config/env.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../config/env.js")>();
  return { env: { ...actual.env } };
});
vi.mock("../telegram/telegram.api.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../telegram/telegram.api.js")>()),
  sendMessage: vi.fn(() => Promise.resolve(true)),
}));

import { createApp } from "../../app.js";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { sendMessage } from "../telegram/telegram.api.js";

// Уведомление администратору о новом заказе (ТЗ, раздел 8).
const app = createApp();
const send = vi.mocked(sendMessage);

let productId: string;

const order = (body: object = {}) =>
  request(app)
    .post("/api/orders")
    .send({
      name: "Анна Коваленко",
      phone: "0991234567",
      comment: "Можно после 18:00",
      items: [{ productId, quantity: 2 }],
      ...body,
    });
const flush = () => new Promise((resolve) => setTimeout(resolve, 30));

beforeEach(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  productId = (
    await prisma.product.create({
      data: { name: "Соевая свеча", description: "d", price: 320, category: "candles", stock: 5 },
    })
  ).id;
  send.mockReset();
  send.mockResolvedValue(true);
  env.TELEGRAM_BOT_TOKEN = "test-bot-token";
  env.TELEGRAM_ADMIN_CHAT_ID = "admin-chat";
});

afterAll(async () => {
  env.TELEGRAM_BOT_TOKEN = undefined;
  env.TELEGRAM_ADMIN_CHAT_ID = undefined;
  await prisma.$disconnect();
});

describe("уведомление о новом заказе", () => {
  it("после оформления админу уходит сообщение с номером, покупателем, составом и суммой", async () => {
    const res = await order();
    const created = res.body as { number: number };

    expect(res.status).toBe(201);
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    const [chatId, text] = send.mock.calls[0];
    expect(chatId).toBe("admin-chat");
    expect(text).toContain(`🛍 Новый заказ #${created.number}`);
    expect(text).toContain("👤 Имя: Анна Коваленко");
    expect(text).toContain("📞 Телефон: +380991234567");
    expect(text).toContain("💬 Комментарий: Можно после 18:00");
    expect(text).toContain("— Соевая свеча × 2 — 640 грн");
    expect(text).toContain("💰 Итого: 640 грн");
  });

  it("сбой Telegram не ломает заказ: 201, заказ и списание остатка сохранены", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    send.mockRejectedValue(new Error("Telegram недоступен"));

    const res = await order();

    expect(res.status).toBe(201);
    await flush();
    expect(await prisma.order.count()).toBe(1);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(3);
  });

  it("отклонённый заказ (нет остатка) не уведомляет", async () => {
    const res = await order({ items: [{ productId, quantity: 6 }] });

    expect(res.status).toBe(409);
    await flush();
    expect(send).not.toHaveBeenCalled();
  });

  it("невалидный заказ не уведомляет", async () => {
    expect((await order({ phone: "abc" })).status).toBe(400);
    await flush();
    expect(send).not.toHaveBeenCalled();
  });

  it("чат администратора не задан — уведомление пропускается, заказ создаётся", async () => {
    env.TELEGRAM_ADMIN_CHAT_ID = undefined;

    expect((await order()).status).toBe(201);
    await flush();
    expect(send).not.toHaveBeenCalled();
  });
});
