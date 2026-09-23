"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// Проверка логина/пароля и редирект по роли (user → "/", admin → "/admin",
// неверные данные → сообщение) — вместе с Auth-модулем backend
// (пункт 15 плана, docs/cozy-home-tz.md раздел 6).
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setNotice("Вход подключится вместе с Auth-модулем backend.");
  };

  return (
    <AuthCard title="Вход">
      <form onSubmit={handleSubmit} className="flex flex-col gap-16">
        <label className="flex flex-col gap-6">
          <span className="font-gp text-caption tracking-caption text-soot">Email</span>
          <Input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="example@mail.com"
          />
        </label>

        <label className="flex flex-col gap-6">
          <span className="font-gp text-caption tracking-caption text-soot">Пароль</span>
          <Input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </label>

        <label className="flex items-center gap-8 font-gp text-caption tracking-caption text-soot">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="accent-soot"
          />
          Запомнить меня
        </label>

        {notice && <p className="font-gp text-caption tracking-caption text-soot">{notice}</p>}

        <Button type="submit" variant="solid">
          Войти
        </Button>

        <div className="flex flex-col gap-8 font-gp text-caption tracking-caption text-soot">
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
