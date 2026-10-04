"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type AuthUser } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch, ApiError } from "@/lib/api";
import { useCartStore } from "@/store/cart.store";
import { formatPhoneInput, isValidPhone, PHONE_PATTERN } from "@/lib/phone";
import { getPasswordError } from "@/lib/validate-password";
import type { Order, OrderStatus } from "@/types/order";

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новый",
  processing: "В обработке",
  done: "Выполнен",
  cancelled: "Отменён",
};

// Правка профиля (доработка пункта 23 по решению из чата 2026-10-04):
// имя/email/телефон — PATCH /api/auth/me, пароль — отдельной формой,
// PATCH /api/auth/me/password (требует текущий пароль).
function EditProfileForm({ user, onSaved }: { user: AuthUser; onSaved: (user: AuthUser) => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ? formatPhoneInput(user.phone) : "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (phone && !isValidPhone(phone)) {
      setError("Введите корректный номер телефона");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const result = await apiFetch<{ user: AuthUser }>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ name, email, phone: phone || null }),
      });
      onSaved(result.user);
    } catch (error) {
      setError(
        error instanceof ApiError
          ? error.message
          : "Не удалось сохранить изменения, попробуйте ещё раз",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-16 rounded-lg bg-bone p-16"
    >
      <label className="flex flex-col gap-8">
        <span className="font-lunar text-caption tracking-caption text-stone">Имя</span>
        <Input required value={name} onChange={(event) => setName(event.target.value)} />
      </label>

      <label className="flex flex-col gap-8">
        <span className="font-lunar text-caption tracking-caption text-stone">Email</span>
        <Input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-8">
        <span className="font-lunar text-caption tracking-caption text-stone">
          Телефон (необязательно)
        </span>
        <Input
          type="tel"
          inputMode="tel"
          pattern={PHONE_PATTERN}
          title="Номер в формате +380 50 123 45 67"
          value={phone}
          onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
          placeholder="+380 50 123 45 67"
        />
      </label>

      {error && <p className="font-lunar text-caption tracking-caption text-stone">{error}</p>}

      <Button type="submit" variant="primary" disabled={isSubmitting} className="self-start">
        Сохранить
      </Button>
    </form>
  );
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const passwordError = getPasswordError(newPassword, confirmNewPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/auth/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      onDone();
    } catch (error) {
      setError(
        error instanceof ApiError ? error.message : "Не удалось сменить пароль, попробуйте ещё раз",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-16 rounded-lg bg-bone p-16"
    >
      <label className="flex flex-col gap-8">
        <span className="font-lunar text-caption tracking-caption text-stone">Текущий пароль</span>
        <Input
          required
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-8">
        <span className="font-lunar text-caption tracking-caption text-stone">Новый пароль</span>
        <Input
          required
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="Минимум 8 символов"
        />
      </label>

      <label className="flex flex-col gap-8">
        <span className="font-lunar text-caption tracking-caption text-stone">
          Подтверждение пароля
        </span>
        <Input
          required
          type="password"
          value={confirmNewPassword}
          onChange={(event) => setConfirmNewPassword(event.target.value)}
        />
      </label>

      {error && <p className="font-lunar text-caption tracking-caption text-stone">{error}</p>}

      <Button type="submit" variant="primary" disabled={isSubmitting} className="self-start">
        Сменить пароль
      </Button>
    </form>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const clearCart = useCartStore((state) => state.clear);

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [telegramLinked, setTelegramLinked] = useState<boolean | null>(null);
  const [telegramNotice, setTelegramNotice] = useState<string | null>(null);
  const [isEditingProfile, setEditingProfile] = useState(false);
  const [isChangingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

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
  if (!user || !accessToken) return null;

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-32 px-24 py-32">
      <section className="flex flex-col gap-16">
        <h1 className="font-lunar text-subheading tracking-subheading text-obsidian">
          Личный кабинет
        </h1>

        {isEditingProfile ? (
          <EditProfileForm
            user={user}
            onSaved={(updated) => {
              setSession(updated, accessToken);
              setEditingProfile(false);
            }}
          />
        ) : (
          <>
            <div className="flex flex-col gap-4 font-lunar text-body-sm tracking-body-sm text-obsidian">
              <span>{user.name}</span>
              <span>{user.email}</span>
              {user.phone && <span>{formatPhoneInput(user.phone)}</span>}
            </div>

            <Button variant="ghost" className="self-start" onClick={() => setEditingProfile(true)}>
              Редактировать
            </Button>
          </>
        )}
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

        {isChangingPassword ? (
          <ChangePasswordForm
            onDone={() => {
              setChangingPassword(false);
              setPasswordChanged(true);
            }}
          />
        ) : (
          <Button variant="ghost" className="self-start" onClick={() => setChangingPassword(true)}>
            Сменить пароль
          </Button>
        )}
        {passwordChanged && (
          <p className="font-lunar text-caption tracking-caption text-stone">
            Пароль успешно изменён
          </p>
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
