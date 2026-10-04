"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// Канал восстановления сменён с Telegram на email (решение из чата,
// docs/progress.md, пункт 21) — backend (POST /api/auth/forgot-password)
// готов и всегда отвечает одинаково независимо от того, зарегистрирован ли
// email (чтобы эндпоинт не выдавал список адресов магазина); реальный вызов
// подключится вместе с интеграцией фронта (пункт 23 плана).
const GENERIC_MESSAGE = "Если такой email зарегистрирован, на него отправлен код";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <AuthCard title="Восстановление пароля">
        <div className="flex flex-col gap-16">
          <p className="font-lunar text-body-sm tracking-body-sm text-obsidian">
            {GENERIC_MESSAGE} на {email}. Код действителен 15 минут.
          </p>

          <Link
            href={`/reset-password?email=${encodeURIComponent(email)}`}
            className="rounded-md bg-cobalt-ink px-24 py-12 text-center font-lunar text-body-sm tracking-body-sm font-medium text-canvas-white hover:opacity-90"
          >
            Ввести код из письма
          </Link>

          <button
            type="button"
            onClick={() => setSent(false)}
            className="font-lunar text-caption tracking-caption text-stone hover:underline"
          >
            Назад
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Восстановление пароля">
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

        <Button type="submit" variant="primary">
          Отправить код
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
