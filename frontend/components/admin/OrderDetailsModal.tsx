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
            <span className="font-gp text-body-sm tracking-body-sm text-soot">Заказ #{order.id}</span>
            <button type="button" onClick={onClose} aria-label="Закрыть" className="text-soot">
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-4 font-gp text-body-sm tracking-body-sm text-soot">
            <span>Имя: {order.name}</span>
            <span>Телефон: {order.phone}</span>
            <span>Дата: {order.date}</span>
            {order.comment && <span>Комментарий: {order.comment}</span>}
          </div>

          <div className="border-t border-soot pt-16 font-gp text-body-sm tracking-body-sm text-soot">
            <p className="mb-4">Состав заказа:</p>
            <p>{order.items}</p>
            <p className="mt-8 font-medium">Итого: {order.total} грн</p>
          </div>

          <label className="flex flex-col gap-6">
            <span className="font-gp text-caption tracking-caption text-soot">Статус</span>
            <select
              value={order.status}
              onChange={(event) => onStatusChange(order.id, event.target.value as AdminOrderStatus)}
              className="border-0 border-b border-soot bg-transparent px-0 py-7 font-gp text-body-sm tracking-body-sm text-soot focus:outline-none"
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
