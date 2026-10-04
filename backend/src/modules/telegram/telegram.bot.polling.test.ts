import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./telegram.api.js", () => ({
  getUpdates: vi.fn(),
  sendMessage: vi.fn(() => Promise.resolve(true)),
  errorText: (error: unknown) => (error instanceof Error ? error.message : "неизвестная ошибка"),
}));
vi.mock("./telegram.service.js", () => ({ linkChat: vi.fn() }));

import { getUpdates, sendMessage, type TelegramUpdate } from "./telegram.api.js";
import { startPolling } from "./telegram.bot.js";
import { MESSAGES } from "./telegram.messages.js";

const poll = vi.mocked(getUpdates);
const send = vi.mocked(sendMessage);

const start = (id: number, chatId = 1): TelegramUpdate => ({
  update_id: id,
  message: { text: "/start", chat: { id: chatId, type: "private" } },
});
// «Долгий» запрос, который висит, пока его не отменят.
const hang = (_offset: number, _timeout: number, signal?: AbortSignal) =>
  new Promise<TelegramUpdate[]>((_resolve, reject) => {
    signal?.addEventListener("abort", () => reject(new Error("aborted")));
  });
const offsets = () => poll.mock.calls.map((call) => call[0]);

beforeEach(() => {
  poll.mockReset();
  send.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("startPolling", () => {
  it("обрабатывает обновления и сдвигает offset за последнее", async () => {
    poll.mockResolvedValueOnce([start(5), start(6, 2)]).mockImplementation(hang);

    const stop = startPolling();
    await vi.waitFor(() => expect(poll).toHaveBeenCalledTimes(2));

    expect(offsets()).toEqual([0, 7]);
    expect(send).toHaveBeenCalledWith("1", MESSAGES.welcome);
    expect(send).toHaveBeenCalledWith("2", MESSAGES.welcome);
    stop();
  });

  it("ошибка обработки одного сообщения не останавливает цикл и не теряет остальные", async () => {
    send.mockRejectedValueOnce(new Error("сбой"));
    poll.mockResolvedValueOnce([start(1), start(2, 2)]).mockImplementation(hang);

    const stop = startPolling();
    await vi.waitFor(() => expect(poll).toHaveBeenCalledTimes(2));

    expect(send).toHaveBeenCalledTimes(2);
    expect(offsets()).toEqual([0, 3]);
    stop();
  });

  it("сбой опроса — пауза 5 секунд и повтор с прежним offset, процесс не падает", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    poll.mockRejectedValueOnce(new Error("Conflict")).mockImplementation(hang);

    const stop = startPolling();
    await vi.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(4999);
    expect(poll).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(poll).toHaveBeenCalledTimes(2);
    expect(offsets()).toEqual([0, 0]);
    stop();
  });

  it("остановка отменяет запрос и завершает цикл без повторов и без шума в логе", async () => {
    poll.mockImplementation(hang);

    const stop = startPolling();
    await vi.waitFor(() => expect(poll).toHaveBeenCalledTimes(1));
    stop();
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(poll).toHaveBeenCalledTimes(1);
    expect(console.error).not.toHaveBeenCalled();
  });
});
