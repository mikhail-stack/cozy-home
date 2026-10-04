"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatPhoneInput, PHONE_PATTERN } from "@/lib/phone";
import { apiFetch } from "@/lib/api";
import { useCartStore } from "@/store/cart.store";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

// Заявка принимается оптимистично — onSubmitted() зовётся сразу, не дожидаясь
// ответа сервера (как фоновая синхронизация корзины в cart.store.ts), чтобы
// пользователь сразу увидел «Заявка принята». Сам POST /api/orders уходит
// в фоне; серверную корзину авторизованного пользователя бэкенд очищает сам
// внутри транзакции создания заказа (orders.service.ts). Если корзина пуста
// (сюда можно попасть только напрямую — кнопка в CartDrawer показывается
// лишь при непустой корзине) отправлять нечего, запрос не уходит.
export function CheckoutModal({ isOpen, onClose, onSubmitted }: CheckoutModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const items = useCartStore
      .getState()
      .items.map((item) => ({ productId: item.product.id, quantity: item.quantity }));

    if (items.length > 0) {
      apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({ name, phone, comment: comment || undefined, items }),
      }).catch((error: unknown) => {
        console.error("Не удалось отправить заказ", error);
      });
    }

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
