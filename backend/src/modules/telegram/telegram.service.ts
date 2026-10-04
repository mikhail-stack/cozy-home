import { createHash, randomBytes } from "node:crypto";
import { env } from "../../config/env.js";
import { HttpError } from "../../lib/errors.js";
import { hasErrorCode } from "../../lib/prisma-errors.js";
import { prisma } from "../../lib/prisma.js";
import { errorText, sendMessage } from "./telegram.api.js";
import { formatOrderMessage, type OrderForNotification } from "./telegram.messages.js";

const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;

// В БД — только хеш: утечка таблицы не даёт готовых ссылок привязки.
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Уведомление администратору о новом заказе (ТЗ, раздел 8). Не бросает и
// вызывается без await: заказ уже сохранён, сбой Telegram его не отменяет.
export async function notifyNewOrder(order: OrderForNotification): Promise<void> {
  const chatId = env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId) return;
  try {
    await sendMessage(chatId, formatOrderMessage(order));
  } catch (error) {
    console.error("Telegram: уведомление о заказе не отправлено:", errorText(error));
  }
}

// Одноразовая ссылка t.me/<бот>?start=<токен> для залогиненного пользователя.
// Токен случайный (192 бита, base64url — Telegram допускает в start только
// A–Z a–z 0–9 _ -, до 64 символов); у пользователя действует один — новый
// заменяет предыдущий. Заодно чистятся просроченные.
export async function createLinkToken(userId: string) {
  if (!env.TELEGRAM_BOT_TOKEN) throw new HttpError(503, "Telegram-бот не настроен");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramChatId: true },
  });
  if (!user) throw new HttpError(401, "Сессия истекла, войдите заново");
  if (user.telegramChatId) throw new HttpError(409, "Telegram уже привязан");

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS);
  await prisma.$transaction([
    prisma.telegramLinkToken.deleteMany({
      where: { OR: [{ userId }, { expiresAt: { lt: new Date() } }] },
    }),
    prisma.telegramLinkToken.create({ data: { tokenHash: hashToken(token), userId, expiresAt } }),
  ]);

  return { url: `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${token}`, expiresAt };
}

export async function getLinkStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramChatId: true },
  });
  if (!user) throw new HttpError(401, "Сессия истекла, войдите заново");
  return { linked: user.telegramChatId !== null };
}

export type LinkResult =
  | { status: "linked"; name: string }
  | { status: "invalid" | "user-already-linked" | "chat-in-use" };

// Вызывается ботом по /start <токен>: chat_id — из самого сообщения
// Telegram, а не от пользователя, поэтому подделать его нельзя. Токен
// погашается до проверок, атомарным DELETE (два параллельных /start с одним
// токеном — успешен максимум один); «уже привязан» — один раз, как в ТЗ.
export async function linkChat(rawToken: string, chatId: string): Promise<LinkResult> {
  const record = await prisma.telegramLinkToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: { select: { name: true, telegramChatId: true } } },
  });
  if (!record) return { status: "invalid" };

  const { count } = await prisma.telegramLinkToken.deleteMany({ where: { id: record.id } });
  if (count === 0 || record.expiresAt <= new Date()) return { status: "invalid" };
  if (record.user.telegramChatId) return { status: "user-already-linked" };

  try {
    // updateMany, а не update: условие «telegramChatId ещё пуст» нельзя
    // выразить в where у update (поле unique) — а оно нужно против гонки.
    const { count: updated } = await prisma.user.updateMany({
      where: { id: record.userId, telegramChatId: null },
      data: { telegramChatId: chatId },
    });
    // 0 — аккаунт успел привязаться параллельно (или удалён).
    if (updated === 0) return { status: "user-already-linked" };
  } catch (error) {
    // P2002 — этот chat_id уже у другого аккаунта.
    if (hasErrorCode(error, "P2002")) return { status: "chat-in-use" };
    throw error;
  }
  return { status: "linked", name: record.user.name };
}
