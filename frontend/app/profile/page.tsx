"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api";
import { useCartStore } from "@/store/cart.store";
import type { Order, OrderStatus } from "@/types/order";

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новый",
  processing: "В обработке",
  done: "Выполнен",
  cancelled: "Отменён",
};

// Телефон пользователя из ТЗ (раздел 4.5) не реализован: в модели User
// backend (schema.prisma) такого поля нет ни у одного из пройденных
// пунктов плана — показываем только имя и email, которые реально есть.
// «Редактировать» намеренно без действия — эндпоинта правки профиля в
// backend тоже нет (решение, которое стоит обсудить отдельно).
export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const clearCart = useCartStore((state) => state.clear);

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [telegramLinked, setTelegramLinked] = useState<boolean | null>(null);
  const [telegramNotice, setTelegramNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ orders: Order[] }>("/orders/my")
      .then((result) => setOrders(result.orders))
      .catch(() => setOrders([]));
    apiFetch<{ linked: boolean }>("/telegram/status")
      .then((result) => setTelegramLinked(result.linked))
      .catch(() => setTelegramLinked(null));
  }, [user]);

  const handleLogout = () => {
    void apiFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
    clearSession();
    // Сбрасываем локальную корзину — иначе на общем компьютере она
    // перешла бы следующему вошедшему как «его» гостевая корзина.
    clearCart();
    router.push("/");
  };

  const handleLinkTelegram = async () => {
    setTelegramNotice(null);
    try {
      const { url } = await apiFetch<{ url: string }>("/telegram/link", { method: "POST" });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setTelegramNotice(
        error instanceof ApiError
          ? error.message
          : "Не удалось получить ссылку, попробуйте ещё раз",
      );
    }
  };

  // Доступ ограничен через proxy.ts — пока сессия восстанавливается из
  // refresh-куки (SessionBootstrap), user на миг пуст.
  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-32 px-24 py-32">
      <section className="flex flex-col gap-16">
        <h1 className="font-lunar text-subheading tracking-subheading text-obsidian">
          Личный кабинет
        </h1>

        <div className="flex flex-col gap-4 font-lunar text-body-sm tracking-body-sm text-obsidian">
          <span>{user.name}</span>
          <span>{user.email}</span>
        </div>

        <Button variant="ghost" className="self-start">
          Редактировать
        </Button>
      </section>

      <section className="flex flex-col gap-16">
        <h2 className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian">
          Безопасность
        </h2>
        <p className="font-lunar text-caption tracking-caption text-stone">
          {telegramLinked === null
            ? "Проверяем статус Telegram…"
            : telegramLinked
              ? "Telegram привязан"
              : "Telegram не привязан"}
        </p>
        {telegramNotice && (
          <p className="font-lunar text-caption tracking-caption text-stone">{telegramNotice}</p>
        )}
        {telegramLinked === false && (
          <Button variant="ghost" className="self-start" onClick={() => void handleLinkTelegram()}>
            Привязать Telegram
          </Button>
        )}
      </section>

      <section className="flex flex-col gap-16 rounded-lg bg-bone p-24">
        <h2 className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian">
          История заказов
        </h2>
        <div className="flex flex-col gap-16">
          {orders === null && (
            <p className="font-lunar text-caption tracking-caption text-stone">Загрузка…</p>
          )}
          {orders?.length === 0 && (
            <p className="font-lunar text-caption tracking-caption text-stone">Заказов пока нет</p>
          )}
          {orders?.map((order) => (
            <div key={order.id} className="flex flex-col gap-4">
              <div className="flex items-center justify-between font-lunar text-body-sm tracking-body-sm text-obsidian">
                <span>
                  Заказ #{order.number} от {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                </span>
                <span>{STATUS_LABELS[order.status]}</span>
              </div>
              <p className="font-lunar text-caption tracking-caption text-stone">
                {order.items.map((item) => `${item.product.name} × ${item.quantity}`).join(", ")}
              </p>
              <p className="font-lunar text-caption tracking-caption text-stone">
                {order.totalPrice} грн
              </p>
            </div>
          ))}
        </div>
      </section>

      <Button variant="ghost" onClick={handleLogout} className="self-start">
        Выйти
      </Button>
    </div>
  );
}
