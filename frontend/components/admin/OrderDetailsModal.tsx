"use client";

import { Modal } from "@/components/ui/Modal";
import { STATUS_LABELS, type AdminOrder, type AdminOrderStatus } from "@/lib/mock-orders";

interface OrderDetailsModalProps {
  order: AdminOrder | null;
  onClose: () => void;
  onStatusChange: (id: number, status: AdminOrderStatus) => void;
}

export function OrderDetailsModal({ order, onClose, onStatusChange }: OrderDetailsModalProps) {
  return (
    <Modal isOpen={Boolean(order)} onClose={onClose}>
      {order && (
        <div className="flex flex-col gap-16">
          <div className="flex items-center justify-between">
            <span className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian">
              Заказ #{order.id}
            </span>
            <button type="button" onClick={onClose} aria-label="Закрыть" className="text-obsidian">
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-4 font-lunar text-body-sm tracking-body-sm text-obsidian">
            <span>Имя: {order.name}</span>
            <span>Телефон: {order.phone}</span>
            <span>Дата: {order.date}</span>
            {order.comment && <span>Комментарий: {order.comment}</span>}
          </div>

          <div className="rounded-lg bg-bone p-16 font-lunar text-body-sm tracking-body-sm text-obsidian">
            <p className="mb-4 text-stone">Состав заказа:</p>
            <p>{order.items}</p>
            <p className="mt-8 font-medium">Итого: {order.total} грн</p>
          </div>

          <label className="flex flex-col gap-8">
            <span className="font-lunar text-caption tracking-caption text-stone">Статус</span>
            <select
              value={order.status}
              onChange={(event) => onStatusChange(order.id, event.target.value as AdminOrderStatus)}
              className="rounded-lg border border-graphite bg-ash px-16 py-12 font-lunar text-body-sm tracking-body-sm text-obsidian focus:border-cobalt-ink focus:outline-none"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </Modal>
  );
}
