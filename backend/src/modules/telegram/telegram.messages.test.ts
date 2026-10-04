import { describe, expect, it } from "vitest";
import {
  formatDateTime,
  formatMoney,
  formatOrderMessage,
  type OrderForNotification,
} from "./telegram.messages.js";

// Формат — docs/cozy-home-tz.md, раздел 8 («Формат уведомления о заказе»).
const order = (patch: Partial<OrderForNotification> = {}): OrderForNotification => ({
  number: 42,
  name: "Анна Коваленко",
  phone: "+380991234567",
  comment: "Можно после 18:00",
  totalPrice: 1840,
  createdAt: new Date("2026-08-29T09:45:00.000Z"),
  items: [
    { quantity: 2, price: 320, product: { name: "Соевая свеча «Лаванда и ваниль»" } },
    { quantity: 1, price: 1200, product: { name: "Льняной плед «Туман»" } },
  ],
  ...patch,
});

describe("formatOrderMessage", () => {
  it("совпадает с примером из ТЗ дословно", () => {
    expect(formatOrderMessage(order())).toBe(
      [
        "🛍 Новый заказ #42",
        "",
        "👤 Имя: Анна Коваленко",
        "📞 Телефон: +380991234567",
        "💬 Комментарий: Можно после 18:00",
        "",
        "📦 Состав заказа:",
        "— Соевая свеча «Лаванда и ваниль» × 2 — 640 грн",
        "— Льняной плед «Туман» × 1 — 1 200 грн",
        "",
        "💰 Итого: 1 840 грн",
        "🕐 Время: 12:45, 29.08.2026",
      ].join("\n"),
    );
  });

  it("без комментария строки «Комментарий» нет", () => {
    const text = formatOrderMessage(order({ comment: null }));

    expect(text).not.toContain("Комментарий");
    expect(text).toContain("📞 Телефон: +380991234567\n\n📦 Состав заказа:");
  });

  it("очень длинный заказ обрезается до лимита Telegram, шапка и итог остаются", () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      quantity: 3,
      price: 1000,
      product: { name: `Товар с очень длинным названием номер ${i} `.repeat(2).trim() },
    }));

    const text = formatOrderMessage(order({ items, totalPrice: 300000 }));

    expect(text.length).toBeLessThanOrEqual(4096);
    expect(text.startsWith("🛍 Новый заказ #42")).toBe(true);
    expect(text).toContain("💰 Итого: 300 000 грн");
    const shown = text.split("\n").filter((line) => line.startsWith("— ")).length;
    const more = /… и ещё (\d+) поз\./.exec(text);
    expect(more).not.toBeNull();
    expect(shown + Number(more![1])).toBe(100);
  });

  it("короткий заказ не обрезается и не получает «и ещё»", () => {
    expect(formatOrderMessage(order())).not.toContain("и ещё");
  });

  it("текст остаётся обычным: спецсимволы в имени и товарах не экранируются", () => {
    const text = formatOrderMessage(
      order({
        name: "<b>Анна</b> *_[x]*",
        items: [{ quantity: 1, price: 10, product: { name: "A_B *C*" } }],
        totalPrice: 10,
      }),
    );
    expect(text).toContain("👤 Имя: <b>Анна</b> *_[x]*");
    expect(text).toContain("— A_B *C* × 1 — 10 грн");
  });
});

describe("formatMoney", () => {
  it.each([
    [0, "0 грн"],
    [999, "999 грн"],
    [1000, "1 000 грн"],
    [1840, "1 840 грн"],
    [1234567, "1 234 567 грн"],
  ])("%i → %s", (amount, expected) => {
    expect(formatMoney(amount)).toBe(expected);
  });
});

describe("formatDateTime (по Киеву)", () => {
  it("летнее время (UTC+3)", () => {
    expect(formatDateTime(new Date("2026-08-29T09:45:00.000Z"))).toBe("12:45, 29.08.2026");
  });

  it("зимнее время (UTC+2)", () => {
    expect(formatDateTime(new Date("2026-12-01T10:00:00.000Z"))).toBe("12:00, 01.12.2026");
  });

  it("полночь — «00:00», а не «24:00», и дата уже следующая", () => {
    expect(formatDateTime(new Date("2026-08-29T21:05:00.000Z"))).toBe("00:05, 30.08.2026");
  });
});
