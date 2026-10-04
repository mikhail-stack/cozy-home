"use client";

import { Modal } from "@/components/ui/Modal";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { Order, OrderStatus } from "@/types/order";

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  statusError?: string | null;
}

export function OrderDetailsModal({
  order,
  onClose,
  onStatusChange,
  statusError,
}: OrderDetailsModalProps) {
  return (
    <Modal isOpen={Boolean(order)} onClose={onClose}>
      {order && (
        <div className="flex flex-col gap-16">
          <div className="flex items-center justify-between">
            <span className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian">
              Заказ #{order.number}
            </span>
            <button type="button" onClick={onClose} aria-label="Закрыть" className="text-obsidian">
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-4 font-lunar text-body-sm tracking-body-sm text-obsidian">
            <span>Имя: {order.name}</span>
            <span>Телефон: {order.phone}</span>
            <span>Дата: {new Date(order.createdAt).toLocaleDateString("ru-RU")}</span>
            {order.user && (
              <span>
                Аккаунт: {order.user.name} ({order.user.email})
              </span>
            )}
            {order.comment && <span>Комментарий: {order.comment}</span>}
          </div>

          <div className="rounded-lg bg-bone p-16 font-lunar text-body-sm tracking-body-sm text-obsidian">
            <p className="mb-4 text-stone">Состав заказа:</p>
            <p>{order.items.map((item) => `${item.product.name} × ${item.quantity}`).join(", ")}</p>
            <p className="mt-8 font-medium">Итого: {order.totalPrice} грн</p>
          </div>

          <label className="flex flex-col gap-8">
            <span className="font-lunar text-caption tracking-caption text-stone">Статус</span>
            <select
              value={order.status}
              onChange={(event) => onStatusChange(order.id, event.target.value as OrderStatus)}
              className="rounded-lg border border-graphite bg-ash px-16 py-12 font-lunar text-body-sm tracking-body-sm text-obsidian focus:border-cobalt-ink focus:outline-none"
            >
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {statusError && (
            <p className="font-lunar text-caption tracking-caption text-stone">{statusError}</p>
          )}
        </div>
      )}
    </Modal>
  );
}
