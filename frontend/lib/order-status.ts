import type { OrderStatus } from "@/types/order";

// Общие подписи статуса заказа — используются и в истории заказов
// профиля, и в админке (frontend/app/admin/orders/page.tsx,
// components/admin/OrderDetailsModal.tsx).
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новый",
  processing: "В обработке",
  done: "Выполнен",
  cancelled: "Отменён",
};
