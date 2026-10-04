import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Реальный Telegram не трогаем: env — изменяемая копия, отправка сообщений — заглушка.
vi.mock("../../config/env.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../config/env.js")>();
  return { env: { ...actual.env } };
});
vi.mock("./telegram.api.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./telegram.api.js")>()),
  sendMessage: vi.fn(() => Promise.resolve(true)),
}));

import { createApp } from "../../app.js";
import { env } from "../../config/env.js";
import { signAccessToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";
import { sendMessage } from "./telegram.api.js";
import { handleUpdate } from "./telegram.bot.js";
import { MESSAGES } from "./telegram.messages.js";

// Привязка Telegram (ТЗ, раздел 7) — по одноразовой ссылке из личного кабинета.
// Привязка по /link email из ТЗ намеренно отключена: любой, кто знает чужой
// email, привязал бы к нему свой Telegram и получил коды восстановления пароля.
const app = createApp();
const send = vi.mocked(sendMessage);

interface LinkBody {
  url: string;
  expiresAt: string;
  linked: boolean;
  message: string;
}
const json = (res: request.Response) => res.body as LinkBody;

let userId: string;
let token: string;

const auth = (req: request.Test) => req.set("Authorization", `Bearer ${token}`);
const issue = async () => {
  const res = await auth(request(app).post("/api/telegram/link"));
  expect(res.status).toBe(200);
  return /start=([\w-]+)$/.exec(json(res).url)![1];
};
const chatMessage = (chatId: number, text: string, type = "private") => ({
  update_id: 1,
  message: { text, chat: { id: chatId, type } },
});
const chatIdOf = async (id: string) =>
  (await prisma.user.findUniqueOrThrow({ where: { id } })).telegramChatId;
const lastReply = () => send.mock.calls.at(-1)?.[1];

beforeEach(async () => {
  await prisma.telegramLinkToken.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  send.mockClear();
  env.TELEGRAM_BOT_TOKEN = "test-bot-token";

  const user = await prisma.user.create({
    data: { name: "Анна", email: "anna@example.com", password: "hash" },
  });
  userId = user.id;
  token = signAccessToken({ sub: user.id, role: "user" });
});

afterAll(async () => {
  env.TELEGRAM_BOT_TOKEN = undefined;
  await prisma.$disconnect();
});

describe("POST /api/telegram/link и GET /api/telegram/status", () => {
  it.each([
    ["POST /link", () => request(app).post("/api/telegram/link")],
    ["GET /status", () => request(app).get("/api/telegram/status")],
  ])("%s без токена → 401", async (_name, sendRequest) => {
    expect((await sendRequest()).status).toBe(401);
  });

  it("выдаёт ссылку t.me/<бот>?start=<токен> на 15 минут", async () => {
    const before = Date.now();
    const res = await auth(request(app).post("/api/telegram/link"));

    expect(res.status).toBe(200);
    // Формат start-параметра Telegram: A–Z a–z 0–9 _ -, до 64 символов.
    expect(json(res).url).toMatch(/^https:\/\/t\.me\/CozyHomeBot\?start=[A-Za-z0-9_-]{32}$/);
    const ttl = new Date(json(res).expiresAt).getTime() - before;
    expect(ttl).toBeGreaterThan(14 * 60 * 1000);
    expect(ttl).toBeLessThanOrEqual(15 * 60 * 1000 + 1000);
  });

  it("в БД лежит только хеш токена, а не сам токен", async () => {
    const started = await issue();

    const rows = await prisma.telegramLinkToken.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(rows[0].tokenHash).not.toContain(started);
    expect(rows[0].userId).toBe(userId);
  });

  it("новая ссылка отменяет предыдущую — у пользователя действует одна", async () => {
    const first = await issue();
    const second = await issue();

    expect(await prisma.telegramLinkToken.count()).toBe(1);
    await handleUpdate(chatMessage(1, `/start ${first}`));
    expect(lastReply()).toBe(MESSAGES.linkInvalid);
    expect(await chatIdOf(userId)).toBeNull();

    await handleUpdate(chatMessage(1, `/start ${second}`));
    expect(await chatIdOf(userId)).toBe("1");
  });

  it("имя бота берётся из TELEGRAM_BOT_USERNAME", async () => {
    env.TELEGRAM_BOT_USERNAME = "MyShopBot";
    try {
      expect(json(await auth(request(app).post("/api/telegram/link"))).url).toContain(
        "https://t.me/MyShopBot?start=",
      );
    } finally {
      env.TELEGRAM_BOT_USERNAME = "CozyHomeBot";
    }
  });

  it("бот не настроен → 503", async () => {
    env.TELEGRAM_BOT_TOKEN = undefined;

    const res = await auth(request(app).post("/api/telegram/link"));

    expect(res.status).toBe(503);
    expect(json(res).message).toBe("Telegram-бот не настроен");
    expect(await prisma.telegramLinkToken.count()).toBe(0);
  });

  it("уже привязанный аккаунт → 409", async () => {
    await prisma.user.update({ where: { id: userId }, data: { telegramChatId: "77" } });

    const res = await auth(request(app).post("/api/telegram/link"));

    expect(res.status).toBe(409);
    expect(json(res).message).toBe("Telegram уже привязан");
  });

  it("токен удалённого пользователя → 401", async () => {
    await prisma.user.delete({ where: { id: userId } });
    expect((await auth(request(app).post("/api/telegram/link"))).status).toBe(401);
    expect((await auth(request(app).get("/api/telegram/status"))).status).toBe(401);
  });

  it("status: linked меняется после привязки", async () => {
    expect(json(await auth(request(app).get("/api/telegram/status"))).linked).toBe(false);

    await handleUpdate(chatMessage(5, `/start ${await issue()}`));

    expect(json(await auth(request(app).get("/api/telegram/status"))).linked).toBe(true);
  });

  it("просроченные токены других пользователей чистятся при выдаче нового", async () => {
    const other = await prisma.user.create({
      data: { name: "Игорь", email: "igor@example.com", password: "hash" },
    });
    await prisma.telegramLinkToken.create({
      data: { tokenHash: "x".repeat(64), userId: other.id, expiresAt: new Date(Date.now() - 1000) },
    });

    await issue();

    expect(await prisma.telegramLinkToken.count({ where: { userId: other.id } })).toBe(0);
  });
});

describe("бот: /start <токен>", () => {
  it("привязывает chat_id к аккаунту и отвечает по имени", async () => {
    const started = await issue();

    await handleUpdate(chatMessage(4242, `/start ${started}`));

    expect(await chatIdOf(userId)).toBe("4242");
    expect(send).toHaveBeenCalledWith("4242", MESSAGES.linked("Анна"));
  });

  it("токен одноразовый: повтор не работает и запись удалена", async () => {
    const started = await issue();
    await handleUpdate(chatMessage(1, `/start ${started}`));
    expect(await prisma.telegramLinkToken.count()).toBe(0);

    await handleUpdate(chatMessage(2, `/start ${started}`));

    expect(lastReply()).toBe(MESSAGES.linkInvalid);
    expect(await chatIdOf(userId)).toBe("1");
  });

  it("параллельные /start с одним токеном из двух чатов — привязывается один", async () => {
    const started = await issue();

    await Promise.all([
      handleUpdate(chatMessage(10, `/start ${started}`)),
      handleUpdate(chatMessage(20, `/start ${started}`)),
    ]);

    expect(["10", "20"]).toContain(await chatIdOf(userId));
    const replies = send.mock.calls.map((call) => call[1]);
    expect(replies.filter((text) => text === MESSAGES.linked("Анна"))).toHaveLength(1);
  });

  it("просроченный токен не работает", async () => {
    const started = await issue();
    await prisma.telegramLinkToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    await handleUpdate(chatMessage(1, `/start ${started}`));

    expect(lastReply()).toBe(MESSAGES.linkInvalid);
    expect(await chatIdOf(userId)).toBeNull();
  });

  it("выдуманный токен не работает", async () => {
    await handleUpdate(chatMessage(1, "/start not-a-real-token"));

    expect(lastReply()).toBe(MESSAGES.linkInvalid);
  });

  it("этот Telegram уже привязан к другому аккаунту → отказ, аккаунт не привязан", async () => {
    await prisma.user.create({
      data: { name: "Игорь", email: "igor@example.com", password: "hash", telegramChatId: "999" },
    });
    const started = await issue();

    await handleUpdate(chatMessage(999, `/start ${started}`));

    expect(lastReply()).toBe(MESSAGES.chatInUse);
    expect(await chatIdOf(userId)).toBeNull();
  });

  it("аккаунт успел привязаться к другому чату, пока ссылка жила → отказ, chat_id не перезаписан", async () => {
    const started = await issue();
    await prisma.user.update({ where: { id: userId }, data: { telegramChatId: "111" } });

    await handleUpdate(chatMessage(222, `/start ${started}`));

    expect(lastReply()).toBe(MESSAGES.userAlreadyLinked);
    expect(await chatIdOf(userId)).toBe("111");
  });

  it("форма /start@ИмяБота <токен> (так шлёт Telegram в группах и по ссылкам) тоже работает", async () => {
    const started = await issue();

    await handleUpdate(chatMessage(3, `/start@CozyHomeBot ${started}`));

    expect(await chatIdOf(userId)).toBe("3");
  });
});

describe("бот: прочее", () => {
  it("/start без токена — приветствие и ничего не привязывает", async () => {
    await handleUpdate(chatMessage(1, "/start"));

    expect(send).toHaveBeenCalledWith("1", MESSAGES.welcome);
    expect(await chatIdOf(userId)).toBeNull();
  });

  it("/link email НЕ привязывает: знание чужого email не даёт захватить аккаунт", async () => {
    await handleUpdate(chatMessage(666, "/link anna@example.com"));

    expect(send).toHaveBeenCalledWith("666", MESSAGES.linkByEmailDisabled);
    expect(await chatIdOf(userId)).toBeNull();
    expect(await prisma.user.count({ where: { telegramChatId: "666" } })).toBe(0);
  });

  it("любой другой текст — подсказка", async () => {
    await handleUpdate(chatMessage(1, "привет"));
    expect(send).toHaveBeenCalledWith("1", MESSAGES.help);
  });

  it("групповые чаты и не-текстовые обновления игнорируются", async () => {
    const started = await issue();

    await handleUpdate(chatMessage(-100, `/start ${started}`, "group"));
    await handleUpdate({ update_id: 2 });
    await handleUpdate({ update_id: 3, message: { chat: { id: 1, type: "private" } } });

    expect(send).not.toHaveBeenCalled();
    expect(await chatIdOf(userId)).toBeNull();
    expect(await prisma.telegramLinkToken.count()).toBe(1);
  });
});
