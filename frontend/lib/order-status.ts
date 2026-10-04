import type { OrderStatus } from "@/types/order";

// Общие подписи статуса заказа — используются и в истории заказов
// профиля, и в админке (frontend/app/admin/orders/page.tsx,
// components/admin/OrderDetailsModal.tsx). Эмодзи — дословно из ТЗ,
// раздел 9 («Раздел «Заказы» → Статусы»); найдено финальным прогоном
// сценариев пункта 23 — при объединении подписей в подэтапе orders+profile
// эмодзи были случайно потеряны (профильная версия, на которую
// ориентировались, их не несла).
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "🔵 Новый",
  processing: "🟡 В обработке",
  done: "🟢 Выполнен",
  cancelled: "🔴 Отменён",
};
