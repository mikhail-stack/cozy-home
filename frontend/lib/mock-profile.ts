export type OrderStatus = "new" | "processing" | "done" | "cancelled";

export interface OrderHistoryItem {
  id: number;
  date: string;
  items: string;
  total: number;
  status: OrderStatus;
}

// Временные данные — до подключения auth.store к реальной сессии и
// Orders-модулю backend (пункты 15, 18, 23 плана).
export const MOCK_USER = {
  name: "Анна Коваленко",
  email: "anna@example.com",
  phone: "+380991234567",
  telegramLinked: false,
};

// Заказ #42 — тот же пример, что и в шаблоне Telegram-уведомления
// (docs/cozy-home-tz.md, раздел 8).
export const MOCK_ORDERS: OrderHistoryItem[] = [
  {
    id: 42,
    date: "29.08.2026",
    items: "Соевая свеча «Лаванда и ваниль» × 2, Льняной плед «Туман» × 1",
    total: 1840,
    status: "new",
  },
  {
    id: 37,
    date: "18.08.2026",
    items: "Набор мисок «Stone» (3 шт.)",
    total: 860,
    status: "processing",
  },
  {
    id: 30,
    date: "02.08.2026",
    items: "Настенное зеркало в деревянной раме",
    total: 1800,
    status: "done",
  },
];
