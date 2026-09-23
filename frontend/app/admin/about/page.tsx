"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface AdvantageDraft {
  title: string;
  text: string;
}

const INITIAL_ADVANTAGES: AdvantageDraft[] = [
  { title: "Натуральные материалы", text: "Лён, керамика, дерево, соевый воск — никакой пластиковой имитации." },
  { title: "Скандинавский дизайн", text: "Лаконичные формы и спокойные тона для уютного дома." },
  { title: "Быстрая доставка", text: "Оперативно передаём заказ в доставку по всей Украине." },
  { title: "Забота о клиентах", text: "На связи в Telegram и по телефону — поможем с выбором и заказом." },
];

// Реальное сохранение (и отображение изменений на /about) появится
// вместе с About-модулем backend (пункт 19 плана) — форма пока ничего
// не сохраняет между перезагрузками.
export default function AdminAboutPage() {
  const [title, setTitle] = useState("Cozy Home");
  const [description, setDescription] = useState(
    "Cozy Home — интернет-магазин товаров для дома и декора в скандинавском / минималистичном стиле."
  );
  const [advantages, setAdvantages] = useState<AdvantageDraft[]>(INITIAL_ADVANTAGES);
  const [phone, setPhone] = useState("+380 00 000 00 00");
  const [email, setEmail] = useState("hello@cozyhome.ua");
  const [notice, setNotice] = useState<string | null>(null);

  const updateAdvantage = (index: number, field: keyof AdvantageDraft, value: string) => {
    setAdvantages((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setNotice("Сохранение подключится вместе с About-модулем backend.");
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[480px] flex-col gap-16">
      <h1 className="font-lunar text-subheading tracking-subheading text-obsidian">О магазине</h1>

      <label className="flex flex-col gap-8">
        <span className="font-lunar text-caption tracking-caption text-stone">Заголовок</span>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>

      <label className="flex flex-col gap-8">
        <span className="font-lunar text-caption tracking-caption text-stone">Основной текст</span>
        <Input value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>

      <div className="flex flex-col gap-16 rounded-lg bg-bone p-16">
        <span className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian">Преимущества</span>
        {advantages.map((advantage, index) => (
          <div key={index} className="flex flex-col gap-8">
            <Input
              value={advantage.title}
              onChange={(event) => updateAdvantage(index, "title", event.target.value)}
              placeholder="Заголовок"
            />
            <Input
              value={advantage.text}
              onChange={(event) => updateAdvantage(index, "text", event.target.value)}
              placeholder="Текст"
            />
          </div>
        ))}
      </div>

      <label className="flex flex-col gap-8">
        <span className="font-lunar text-caption tracking-caption text-stone">Телефон</span>
        <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
      </label>

      <label className="flex flex-col gap-8">
        <span className="font-lunar text-caption tracking-caption text-stone">Email</span>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>

      {notice && <p className="font-lunar text-caption tracking-caption text-stone">{notice}</p>}

      <Button type="submit" variant="primary" className="self-start">
        Сохранить
      </Button>
    </form>
  );
}
