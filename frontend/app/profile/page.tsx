"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { MOCK_USER, MOCK_ORDERS, type OrderStatus } from "@/lib/mock-profile";

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новый",
  processing: "В обработке",
  done: "Выполнен",
  cancelled: "Отменён",
};

// Данные пользователя/заказов — мок (lib/mock-profile.ts) до подключения
// auth.store к реальной сессии и Orders-модулю backend (пункты 15, 18,
// 23 плана). Доступ страницы только для авторизованных ограничит
// middleware.ts (пункт 12 плана) — пока страница открыта всем.
export default function ProfilePage() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-32 px-20 py-32">
      <section className="flex flex-col gap-16 border-b border-soot pb-32">
        <h1 className="font-gp text-subheading tracking-subheading text-soot">Личный кабинет</h1>

        <div className="flex flex-col gap-4 font-gp text-body-sm tracking-body-sm text-soot">
          <span>{MOCK_USER.name}</span>
          <span>{MOCK_USER.email}</span>
          <span>{MOCK_USER.phone}</span>
        </div>

        <Button variant="link" className="self-start">
          Редактировать
        </Button>
      </section>

      <section className="flex flex-col gap-16 border-b border-soot pb-32">
        <h2 className="font-gp text-body-sm tracking-body-sm text-soot">Безопасность</h2>
        <p className="font-gp text-caption tracking-caption text-soot">
          {MOCK_USER.telegramLinked ? "Telegram привязан" : "Telegram не привязан"}
        </p>
        <Button variant="link" className="self-start">
          Привязать Telegram
        </Button>
      </section>

      <section className="flex flex-col gap-16 border-b border-soot pb-32">
        <h2 className="font-gp text-body-sm tracking-body-sm text-soot">История заказов</h2>
        <div className="flex flex-col">
          {MOCK_ORDERS.map((order) => (
            <div key={order.id} className="flex flex-col gap-4 border-t border-soot py-16 first:border-t-0">
              <div className="flex items-center justify-between font-gp text-body-sm tracking-body-sm text-soot">
                <span>
                  Заказ #{order.id} от {order.date}
                </span>
                <span>{STATUS_LABELS[order.status]}</span>
              </div>
              <p className="font-gp text-caption tracking-caption text-soot">{order.items}</p>
              <p className="font-gp text-caption tracking-caption text-soot">{order.total} грн</p>
            </div>
          ))}
        </div>
      </section>

      <Button variant="link" onClick={handleLogout} className="self-start">
        Выйти
      </Button>
    </div>
  );
}
