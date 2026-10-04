import { env } from "../../config/env.js";

// Тонкий клиент Telegram Bot API поверх fetch. Нужны всего два метода —
// sendMessage и getUpdates, поэтому вместо node-telegram-bot-api (в цепочке
// зависимостей — устаревший `request` и 2 критические уязвимости `npm audit`)
// вызываем HTTP API напрямую. Токен нигде не логируется: в сообщения об
// ошибках попадает только текст ответа Telegram.

export interface TelegramUpdate {
  update_id: number;
  message?: {
    text?: string;
    chat: { id: number; type: string };
  };
}

interface TelegramResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

async function call<T>(method: string, params: object, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal,
  });
  const data = (await response.json()) as TelegramResponse<T>;
  if (!data.ok) {
    throw new Error(`Telegram ${method}: ${data.description ?? `HTTP ${response.status}`}`);
  }
  return data.result as T;
}

export const isBotConfigured = () => Boolean(env.TELEGRAM_BOT_TOKEN);

// Не бросает: сбой Telegram не должен ронять оформление заказа или запрос
// пользователя — результат «доставлено или нет» возвращается булевым значением.
export async function sendMessage(chatId: string | number, text: string): Promise<boolean> {
  if (!isBotConfigured()) return false;
  try {
    await call("sendMessage", { chat_id: chatId, text });
    return true;
  } catch (error) {
    console.error("Telegram: не удалось отправить сообщение:", errorText(error));
    return false;
  }
}

// Long polling: Telegram держит запрос до `timeoutSeconds`, пока не появятся
// обновления. Вебхук не нужен — публичного HTTPS-адреса у локального бэкенда нет.
export function getUpdates(offset: number, timeoutSeconds: number, signal?: AbortSignal) {
  return call<TelegramUpdate[]>(
    "getUpdates",
    { offset, timeout: timeoutSeconds, allowed_updates: ["message"] },
    signal,
  );
}

export const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "неизвестная ошибка";
