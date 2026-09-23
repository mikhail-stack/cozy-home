"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getPasswordError } from "@/lib/validate-password";

// Проверка кода (TTL 15 минут, "Код устарел"/"Неверный код") и смена
// пароля — вместе с Auth-модулем backend (пункт 15 плана,
// docs/cozy-home-tz.md раздел 7). Без backend нет чем эти коды сверять,
// поэтому не подделываем успешный редирект — только клиентские проверки
// пароля, которые останутся и после подключения API.
export default function ResetPasswordPage() {
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
    setNotice("Проверка кода и смена пароля подключатся вместе с Auth-модулем backend.");
  };

  return (
    <AuthCard title="Новый пароль">
      <form onSubmit={handleSubmit} className="flex flex-col gap-16">
        <label className="flex flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">Код из Telegram</span>
          <Input
            required
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
          <span className="font-lunar text-caption tracking-caption text-stone">Подтверждение пароля</span>
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

        <Link href="/login" className="font-lunar text-caption tracking-caption text-stone hover:underline">
          Вернуться ко входу
        </Link>
      </form>
    </AuthCard>
  );
}
