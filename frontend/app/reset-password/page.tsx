"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getPasswordError } from "@/lib/validate-password";
import { apiFetch, ApiError } from "@/lib/api";

// Канал восстановления — email вместо Telegram из ТЗ (раздел 7), код из
// письма; backend (POST /api/auth/reset-password) отвечает ровно текстами
// ниже: "Код устарел, запросите новый" (TTL 15 минут истёк или код исчерпал
// попытки), "Неверный код", "Пароль успешно изменён".
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const passwordError = getPasswordError(password, confirmPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code, password, confirmPassword }),
      });
      router.push("/login?notice=password-changed");
    } catch (error) {
      setError(
        error instanceof ApiError
          ? error.message
          : "Не удалось сохранить пароль, попробуйте ещё раз",
      );
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Новый пароль">
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

        <Button type="submit" variant="primary" disabled={isSubmitting}>
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
