"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getPasswordError } from "@/lib/validate-password";

// Проверка кода и смена пароля — вместе с интеграцией фронта (пункт 23
// плана); backend (POST /api/auth/reset-password) уже реализован (пункт 22)
// и отвечает ровно текстами ниже: "Код устарел, запросите новый" (TTL 15
// минут истёк или код исчерпал попытки), "Неверный код", "Пароль успешно
// изменён". Канал — email вместо Telegram из ТЗ (раздел 7), код из письма.
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const passwordError = getPasswordError(password, confirmPassword);
    if (passwordError) {
      setError(passwordError);
      setNotice(null);
      return;
    }

    setError(null);
    setNotice("Проверка кода и смена пароля подключатся вместе с интеграцией фронта.");
  };

  return (
    <AuthCard title="Новый пароль">
      <form onSubmit={handleSubmit} className="flex flex-col gap-16">
        <label className="flex flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">Email</span>
          <Input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="example@mail.com"
          />
        </label>

        <label className="flex flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">Код из письма</span>
          <Input
            required
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Например, 847291"
          />
        </label>

        <label className="flex flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">Новый пароль</span>
          <Input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Повторите пароль"
          />
        </label>

        {error && <p className="font-lunar text-caption tracking-caption text-stone">{error}</p>}
        {notice && <p className="font-lunar text-caption tracking-caption text-stone">{notice}</p>}

        <Button type="submit" variant="primary">
          Сохранить пароль
        </Button>

        <Link
          href="/login"
          className="font-lunar text-caption tracking-caption text-stone hover:underline"
        >
          Вернуться ко входу
        </Link>
      </form>
    </AuthCard>
  );
}

// useSearchParams требует границу Suspense (иначе Next 16 не соберёт страницу).
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
