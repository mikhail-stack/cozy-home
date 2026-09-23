export type AdminOrderStatus = "new" | "processing" | "done" | "cancelled";

export interface AdminOrder {
  id: number;
  name: string;
  phone: string;
  comment: string;
  items: string;
  total: number;
  date: string;
  status: AdminOrderStatus;
}

// Эмодзи-статусы — дословно из docs/cozy-home-tz.md, раздел 9 (админка —
// внутренний инструмент, не витрина, поэтому монохромное правило
// docs/DESIGN.md здесь не применяется так же строго, как на клиентских
// страницах).
export const STATUS_LABELS: Record<AdminOrderStatus, string> = {
  new: "🔵 Новый",
  processing: "🟡 В обработке",
  done: "🟢 Выполнен",
  cancelled: "🔴 Отменён",
};

// Заказ #42 — тот же пример, что в шаблоне Telegram-уведомления
// (docs/cozy-home-tz.md, раздел 8) и в lib/mock-profile.ts.
export const MOCK_ADMIN_ORDERS: AdminOrder[] = [
  {
    id: 42,
    name: "Анна Коваленко",
    phone: "+380991234567",
    comment: "Можно после 18:00",
    items: "Соевая свеча «Лаванда и ваниль» × 2, Льняной плед «Туман» × 1",
    total: 1840,
    date: "2026-08-29",
    status: "new",
  },
  {
    id: 41,
    name: "Игорь Петренко",
    phone: "+380661112233",
    comment: "",
    items: "Набор мисок «Stone» (3 шт.)",
    total: 860,
    date: "2026-08-24",
    status: "processing",
  },
  {
    id: 40,
    name: "Мария Савчук",
    phone: "+380672223344",
    comment: "",
    items: "Настенное зеркало в деревянной раме",
    total: 1800,
    date: "2026-08-24",
    status: "done",
  },
  {
    id: 39,
    name: "Ольга Романенко",
    phone: "+380504445566",
    comment: "Перезвоните завтра",
    items: "Плакат «Minimal Forest» A3",
    total: 220,
    date: "2026-08-20",
    status: "cancelled",
  },
];
