"use client";

import { useMemo, useState } from "react";
import { MOCK_ADMIN_ORDERS, STATUS_LABELS, type AdminOrder, type AdminOrderStatus } from "@/lib/mock-orders";
import { OrderDetailsModal } from "@/components/admin/OrderDetailsModal";
import { Input } from "@/components/ui/Input";

type StatusFilter = "all" | AdminOrderStatus;

const selectClasses =
  "rounded-lg border border-graphite bg-ash px-16 py-12 font-lunar text-body-sm tracking-body-sm text-obsidian focus:border-cobalt-ink focus:outline-none";

// Данные — мок, смена статуса не сохраняется между перезагрузками.
// Реальные заказы появятся с Orders-модулем backend (пункт 18 плана).
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>(MOCK_ADMIN_ORDERS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (dateFrom && order.date < dateFrom) return false;
      if (dateTo && order.date > dateTo) return false;

      const query = search.trim().toLowerCase();
      if (query && !order.name.toLowerCase().includes(query) && !order.phone.includes(query)) {
        return false;
      }

      return true;
    });
  }, [orders, statusFilter, dateFrom, dateTo, search]);

  const handleStatusChange = (id: number, status: AdminOrderStatus) => {
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));
    setSelectedOrder((current) => (current && current.id === id ? { ...current, status } : current));
  };

  return (
    <div className="flex flex-col gap-24">
      <h1 className="font-lunar text-subheading tracking-subheading text-obsidian">Заказы</h1>

      <div className="flex flex-wrap items-end gap-16">
        <label className="flex flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">Статус</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className={selectClasses}
          >
            <option value="all">Все статусы</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">С даты</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className={selectClasses}
          />
        </label>

        <label className="flex flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">По дату</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className={selectClasses}
          />
        </label>

        <label className="flex min-w-[200px] flex-1 flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">Поиск по имени/телефону</span>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Анна или +380..." />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-lunar text-body-sm tracking-body-sm text-obsidian">
          <thead>
            <tr className="border-b border-ash text-left">
              <th className="py-8 pr-16">#</th>
              <th className="py-8 pr-16">Имя</th>
              <th className="py-8 pr-16">Телефон</th>
              <th className="py-8 pr-16">Сумма</th>
              <th className="py-8 pr-16">Дата</th>
              <th className="py-8 pr-16">Статус</th>
              <th className="py-8">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} className="border-b border-ash">
                <td className="py-8 pr-16">{order.id}</td>
                <td className="py-8 pr-16">{order.name}</td>
                <td className="py-8 pr-16">{order.phone}</td>
                <td className="py-8 pr-16">{order.total} грн</td>
                <td className="py-8 pr-16">{order.date}</td>
                <td className="py-8 pr-16">{STATUS_LABELS[order.status]}</td>
                <td className="py-8">
                  <button type="button" onClick={() => setSelectedOrder(order)} className="hover:underline">
                    Просмотр
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center text-stone">
                  Ничего не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
