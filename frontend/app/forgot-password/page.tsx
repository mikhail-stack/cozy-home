"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api";

// Канал восстановления сменён с Telegram на email (решение из чата,
// docs/progress.md, пункт 21) — backend (POST /api/auth/forgot-password)
// всегда отвечает одинаково независимо от того, зарегистрирован ли email
// (чтобы эндпоинт не выдавал список адресов магазина).
const GENERIC_MESSAGE = "Если такой email зарегистрирован, на него отправлен код";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setSent(true);
    } catch (error) {
      setError(
        error instanceof ApiError ? error.message : "Не удалось отправить код, попробуйте ещё раз",
      );
    } finally {
      setSubmitting(false);
    }
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
      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-16">
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

        {error && <p className="font-lunar text-caption tracking-caption text-stone">{error}</p>}

        <Button type="submit" variant="primary" disabled={isSubmitting}>
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
