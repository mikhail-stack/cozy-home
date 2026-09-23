"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getPasswordError } from "@/lib/validate-password";

// Проверка занятости email и создание аккаунта — вместе с Auth-модулем
// backend (пункт 15 плана). Проверки пароля (длина/совпадение) — чисто
// клиентские, останутся и после подключения API.
export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
    setNotice("Регистрация подключится вместе с Auth-модулем backend.");
  };

  return (
    <AuthCard title="Регистрация">
      <form onSubmit={handleSubmit} className="flex flex-col gap-16">
        <label className="flex flex-col gap-6">
          <span className="font-gp text-caption tracking-caption text-soot">Имя</span>
          <Input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Ваше имя" />
        </label>

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
            placeholder="Минимум 8 символов"
          />
        </label>

        <label className="flex flex-col gap-6">
          <span className="font-gp text-caption tracking-caption text-soot">Подтверждение пароля</span>
          <Input
            required
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Повторите пароль"
          />
        </label>

        {error && <p className="font-gp text-caption tracking-caption text-soot">{error}</p>}
        {notice && <p className="font-gp text-caption tracking-caption text-soot">{notice}</p>}

        <Button type="submit" variant="solid">
          Зарегистрироваться
        </Button>

        <Link href="/login" className="font-gp text-caption tracking-caption text-soot hover:underline">
          Уже есть аккаунт? Войти
        </Link>
      </form>
    </AuthCard>
  );
}
