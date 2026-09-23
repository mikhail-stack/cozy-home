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
// 23 плана). Доступ ограничен через proxy.ts (пункт 12 плана).
// Разделы отделены отступами и Bone-поверхностью истории заказов, без
// hairline-рамок (docs/DESIGN.md).
export default function ProfilePage() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-32 px-24 py-32">
      <section className="flex flex-col gap-16">
        <h1 className="font-lunar text-subheading tracking-subheading text-obsidian">
          Личный кабинет
        </h1>

        <div className="flex flex-col gap-4 font-lunar text-body-sm tracking-body-sm text-obsidian">
          <span>{MOCK_USER.name}</span>
          <span>{MOCK_USER.email}</span>
          <span>{MOCK_USER.phone}</span>
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
          {MOCK_USER.telegramLinked ? "Telegram привязан" : "Telegram не привязан"}
        </p>
        <Button variant="ghost" className="self-start">
          Привязать Telegram
        </Button>
      </section>

      <section className="flex flex-col gap-16 rounded-lg bg-bone p-24">
        <h2 className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian">
          История заказов
        </h2>
        <div className="flex flex-col gap-16">
          {MOCK_ORDERS.map((order) => (
            <div key={order.id} className="flex flex-col gap-4">
              <div className="flex items-center justify-between font-lunar text-body-sm tracking-body-sm text-obsidian">
                <span>
                  Заказ #{order.id} от {order.date}
                </span>
                <span>{STATUS_LABELS[order.status]}</span>
              </div>
              <p className="font-lunar text-caption tracking-caption text-stone">{order.items}</p>
              <p className="font-lunar text-caption tracking-caption text-stone">
                {order.total} грн
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
