"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

// Отправка пока не уходит на backend — реальная заявка (Order + уведомление
// в Telegram) появится вместе с Orders-модулем (backend, пункт 18 плана).
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
          <span className="font-gp text-body-sm tracking-body-sm text-soot">Оформление заказа</span>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="text-soot">
            ✕
          </button>
        </div>

        <label className="flex flex-col gap-6">
          <span className="font-gp text-caption tracking-caption text-soot">Имя</span>
          <Input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ваше имя"
          />
        </label>

        <label className="flex flex-col gap-6">
          <span className="font-gp text-caption tracking-caption text-soot">Телефон</span>
          <Input
            required
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+380"
          />
        </label>

        <label className="flex flex-col gap-6">
          <span className="font-gp text-caption tracking-caption text-soot">Комментарий (необязательно)</span>
          <Input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Например, удобное время доставки"
          />
        </label>

        <Button type="submit" variant="solid" className="w-full">
          Отправить заявку
        </Button>
      </form>
    </Modal>
  );
}
