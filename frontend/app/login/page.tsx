"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/store/auth.store";
import { mergeGuestCartIntoServer } from "@/lib/sync-cart";

interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

const NOTICE_MESSAGES: Record<string, string> = {
  "password-changed": "Пароль успешно изменён",
};

// Редирект по роли (ТЗ, раздел 6): user → "/", admin → "/admin"; если на
// страницу привёл proxy.ts (заход на /profile или /admin без сессии) —
// возвращаем туда, куда пользователь и шёл, через ?redirect=.
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const notice = error ? null : NOTICE_MESSAGES[searchParams.get("notice") ?? ""];

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, rememberMe }),
      });
      setSession(result.user, result.accessToken);
      await mergeGuestCartIntoServer();

      const redirect = searchParams.get("redirect");
      router.push(redirect ?? (result.user.role === "admin" ? "/admin" : "/"));
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Не удалось войти, попробуйте ещё раз");
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Вход">
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
          <span className="font-lunar text-caption tracking-caption text-stone">Пароль</span>
          <Input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </label>

        <label className="flex items-center gap-8 font-lunar text-caption tracking-caption text-stone">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="accent-cobalt-ink"
          />
          Запомнить меня
        </label>

        {(error ?? notice) && (
          <p className="font-lunar text-caption tracking-caption text-stone">{error ?? notice}</p>
        )}

        <Button type="submit" variant="primary" disabled={isSubmitting}>
          Войти
        </Button>

        <div className="flex flex-col gap-8 font-lunar text-caption tracking-caption text-stone">
          <Link href="/register" className="hover:underline">
            Нет аккаунта? Зарегистрироваться
          </Link>
          <Link href="/forgot-password" className="hover:underline">
            Забыли пароль?
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}

// useSearchParams требует границу Suspense (иначе Next 16 не соберёт страницу).
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
