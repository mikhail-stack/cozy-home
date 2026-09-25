"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatPhoneInput, PHONE_PATTERN } from "@/lib/phone";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

// Отправка пока не уходит на backend — Orders-модуль готов (пункт 18 плана),
// форму подключим к POST /api/orders в пункте 23 (интеграция фронта).
export function CheckoutModal({ isOpen, onClose, onSubmitted }: CheckoutModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmitted();
    setName("");
    setPhone("");
    setComment("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-16">
        <div className="flex items-center justify-between">
          <span className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian">
            Оформление заказа
          </span>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="text-obsidian">
            ✕
          </button>
        </div>

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
          <span className="font-lunar text-caption tracking-caption text-stone">Телефон</span>
          <Input
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={17}
            pattern={PHONE_PATTERN}
            title="Номер в формате +380 50 123 45 67"
            value={phone}
            onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
            placeholder="+380 50 123 45 67"
          />
        </label>

        <label className="flex flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">
            Комментарий (необязательно)
          </span>
          <Input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Например, удобное время доставки"
          />
        </label>

        <Button type="submit" variant="primary" className="w-full">
          Отправить заявку
        </Button>
      </form>
    </Modal>
  );
}
