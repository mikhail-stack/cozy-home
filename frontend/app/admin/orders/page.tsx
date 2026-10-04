"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { Order, OrderStatus } from "@/types/order";
import { OrderDetailsModal } from "@/components/admin/OrderDetailsModal";
import { Input } from "@/components/ui/Input";

type StatusFilter = "all" | OrderStatus;

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

const selectClasses =
  "rounded-lg border border-graphite bg-ash px-16 py-12 font-lunar text-body-sm tracking-body-sm text-obsidian focus:border-cobalt-ink focus:outline-none";

// Фильтрация и поиск — на бэкенде (GET /api/orders, admin), не на клиенте:
// список заказов может расти, а сервер уже умеет все нужные параметры
// (status/from/to/q, пункт 18 плана). lib/mock-orders.ts (и локальный
// AdminOrder с id: number) больше не используется — здесь настоящий
// Order/OrderStatus из frontend/types/order.ts, где id — строка (cuid),
// а человекочитаемый номер заказа — отдельное поле `number`.
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (search.trim()) params.set("q", search.trim());

    let cancelled = false;

    apiFetch<OrdersResponse>(`/orders?${params.toString()}`)
      .then((result) => {
        if (cancelled) return;
        setOrders(result.orders);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setOrders([]);
        setLoadError(error instanceof ApiError ? error.message : "Не удалось загрузить заказы");
      });

    return () => {
      cancelled = true;
    };
  }, [statusFilter, dateFrom, dateTo, search]);

  const handleOpenOrder = (order: Order) => {
    setStatusError(null);
    setSelectedOrder(order);
  };

  const handleStatusChange = (id: string, status: OrderStatus) => {
    setStatusError(null);
    apiFetch<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
      .then((updated) => {
        setOrders(
          (current) => current?.map((order) => (order.id === id ? updated : order)) ?? current,
        );
        setSelectedOrder((current) => (current && current.id === id ? updated : current));
      })
      .catch((error: unknown) => {
        setStatusError(error instanceof ApiError ? error.message : "Не удалось сменить статус");
      });
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
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
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
          <span className="font-lunar text-caption tracking-caption text-stone">
            Поиск по имени/телефону
          </span>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Анна или +380..."
          />
        </label>
      </div>

      {loadError && (
        <p className="font-lunar text-caption tracking-caption text-stone">{loadError}</p>
      )}

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
            {orders === null && (
              <tr>
                <td colSpan={7} className="py-16 text-center text-stone">
                  Загрузка…
                </td>
              </tr>
            )}
            {orders?.map((order) => (
              <tr key={order.id} className="border-b border-ash">
                <td className="py-8 pr-16">{order.number}</td>
                <td className="py-8 pr-16">{order.name}</td>
                <td className="py-8 pr-16">{order.phone}</td>
                <td className="py-8 pr-16">{order.totalPrice} грн</td>
                <td className="py-8 pr-16">
                  {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                </td>
                <td className="py-8 pr-16">{ORDER_STATUS_LABELS[order.status]}</td>
                <td className="py-8">
                  <button
                    type="button"
                    onClick={() => handleOpenOrder(order)}
                    className="hover:underline"
                  >
                    Просмотр
                  </button>
                </td>
              </tr>
            ))}
            {orders?.length === 0 && (
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
        statusError={statusError}
      />
    </div>
  );
}
