import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Тестовый env общий на файл: подменяем токен на лету, реальный Telegram не трогаем.
vi.mock("../../config/env.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../config/env.js")>();
  return { env: { ...actual.env } };
});

import { env } from "../../config/env.js";
import { getUpdates, isBotConfigured, sendMessage } from "./telegram.api.js";

const SECRET = "123456:SECRET-TOKEN";
const fetchMock = vi.fn();
const reply = (body: object, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  env.TELEGRAM_BOT_TOKEN = SECRET;
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  env.TELEGRAM_BOT_TOKEN = undefined;
});

describe("sendMessage", () => {
  it("без токена ничего не отправляет и возвращает false", async () => {
    env.TELEGRAM_BOT_TOKEN = undefined;

    expect(isBotConfigured()).toBe(false);
    expect(await sendMessage("1", "привет")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("шлёт POST на sendMessage Bot API с chat_id и текстом", async () => {
    fetchMock.mockReturnValue(reply({ ok: true, result: {} }));

    expect(await sendMessage("555", "Привет")).toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://api.telegram.org/bot${SECRET}/sendMessage`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ chat_id: "555", text: "Привет" });
  });

  it("ответ ok:false → false, не бросает, токен в лог не попадает", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchMock.mockReturnValue(
      reply({ ok: false, description: "Forbidden: bot was blocked by the user" }, 403),
    );

    expect(await sendMessage("555", "x")).toBe(false);

    expect(log).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(log.mock.calls)).toContain("bot was blocked");
    expect(JSON.stringify(log.mock.calls)).not.toContain(SECRET);
  });

  it("сетевой сбой → false, не бросает, токен в лог не попадает", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchMock.mockRejectedValue(new Error("fetch failed"));

    expect(await sendMessage("555", "x")).toBe(false);

    expect(JSON.stringify(log.mock.calls)).not.toContain(SECRET);
  });

  it("ответ не JSON → false, не бросает", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchMock.mockReturnValue(Promise.resolve(new Response("<html>502</html>", { status: 502 })));

    expect(await sendMessage("555", "x")).toBe(false);
  });
});

describe("getUpdates", () => {
  it("передаёт offset, timeout и allowed_updates, возвращает result", async () => {
    const updates = [
      { update_id: 7, message: { text: "/start", chat: { id: 1, type: "private" } } },
    ];
    fetchMock.mockReturnValue(reply({ ok: true, result: updates }));

    expect(await getUpdates(8, 25)).toEqual(updates);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://api.telegram.org/bot${SECRET}/getUpdates`);
    expect(JSON.parse(init.body as string)).toEqual({
      offset: 8,
      timeout: 25,
      allowed_updates: ["message"],
    });
  });

  it("ошибка Telegram (например, конфликт двух экземпляров) → бросает с описанием", async () => {
    fetchMock.mockReturnValue(
      reply({ ok: false, description: "Conflict: terminated by other getUpdates request" }, 409),
    );

    await expect(getUpdates(0, 25)).rejects.toThrow("Conflict: terminated by other getUpdates");
  });

  it("сигнал отмены доходит до fetch", async () => {
    fetchMock.mockReturnValue(reply({ ok: true, result: [] }));
    const controller = new AbortController();

    await getUpdates(0, 25, controller.signal);

    expect((fetchMock.mock.calls[0] as [string, RequestInit])[1].signal).toBe(controller.signal);
  });
});
