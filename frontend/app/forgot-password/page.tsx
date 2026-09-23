"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// Реальная проверка привязки Telegram по email — вместе с Auth-модулем
// backend (пункт 15 плана). Пока всегда показываем сценарий "Telegram не
// привязан" из docs/cozy-home-tz.md, раздел 7 — второй (привязан → сразу
// код) появится вместе с бэкендом.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "instructions">("email");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setStep("instructions");
  };

  if (step === "instructions") {
    return (
      <AuthCard title="Восстановление пароля">
        <div className="flex flex-col gap-16">
          <p className="font-gp text-body-sm tracking-body-sm text-soot">
            Telegram не привязан к аккаунту {email}. Чтобы получить код:
          </p>

          <ol className="flex list-decimal flex-col gap-8 pl-20 font-gp text-body-sm tracking-body-sm text-soot">
            <li>
              Напишите боту{" "}
              <a
                href="https://t.me/CozyHomeBot"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                @CozyHomeBot
              </a>
            </li>
            <li>Отправьте команду /link {email || "ваш@email.com"}</li>
            <li>Вернитесь и нажмите «Я написал боту»</li>
          </ol>

          <Link
            href="/reset-password"
            className="bg-graphite px-16 py-10 text-center font-gp text-body-sm tracking-body-sm text-chalk hover:opacity-90"
          >
            Я написал боту
          </Link>

          <button
            type="button"
            onClick={() => setStep("email")}
            className="font-gp text-caption tracking-caption text-soot hover:underline"
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

        <Button type="submit" variant="solid">
          Отправить код
        </Button>

        <Link href="/login" className="font-gp text-caption tracking-caption text-soot hover:underline">
          Вернуться ко входу
        </Link>
      </form>
    </AuthCard>
  );
}
