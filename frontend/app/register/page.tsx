"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getPasswordError } from "@/lib/validate-password";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/store/auth.store";
import { mergeGuestCartIntoServer } from "@/lib/sync-cart";

interface RegisterResponse {
  user: AuthUser;
  accessToken: string;
}

// Успешная регистрация → пользователь залогинен, редирект на главную (ТЗ,
// раздел 6) — новый аккаунт всегда с ролью user, в отличие от /login
// редирект по роли не нужен.
export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
      const result = await apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      setSession(result.user, result.accessToken);
      await mergeGuestCartIntoServer();
      router.push("/");
    } catch (error) {
      setError(
        error instanceof ApiError
          ? error.message
          : "Не удалось зарегистрироваться, попробуйте ещё раз",
      );
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Регистрация">
      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-16">
        <label className="flex flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">Имя</span>
          <Input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ваше имя"
          />
        </label>

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
          <span className="font-lunar text-caption tracking-caption text-stone">Пароль</span>
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
          Зарегистрироваться
        </Button>

        <Link
          href="/login"
          className="font-lunar text-caption tracking-caption text-stone hover:underline"
        >
          Уже есть аккаунт? Войти
        </Link>
      </form>
    </AuthCard>
  );
}
