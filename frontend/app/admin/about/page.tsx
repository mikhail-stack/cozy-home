"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api";
import { formatPhoneInput, isValidPhone, PHONE_PATTERN } from "@/lib/phone";
import type { AboutContent, AboutAdvantage } from "@/types/about";

const MAX_ADVANTAGES = 8;
const MIN_ADVANTAGES = 1;

// Реализовано (пункт 23, подэтап about): форма раньше ничего не сохраняла
// (см. git-историю) — теперь настоящий GET/PUT /api/about. PUT заменяет
// содержимое целиком (не PATCH), поэтому при сохранении шлём все поля сразу.
// Иконка преимущества грузится через общий POST /api/products/upload (тот же
// imageRef-валидатор на бэкенде, что и у фото товаров — отдельного эндпоинта
// для About нет и не нужен). Добавление/удаление преимущества — новое по
// сравнению со старой формой с фиксированными 4 пунктами: бэкенд требует
// от 1 до 8 штук.
export default function AdminAboutPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [advantages, setAdvantages] = useState<AboutAdvantage[]>([]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [isLoading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AboutContent>("/about")
      .then((result) => {
        setTitle(result.title);
        setDescription(result.description);
        setAdvantages(result.advantages);
        setPhone(formatPhoneInput(result.phone));
        setEmail(result.email);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof ApiError ? err.message : "Не удалось загрузить страницу");
      })
      .finally(() => setLoading(false));
  }, []);

  const updateAdvantage = (index: number, field: keyof AboutAdvantage, value: string) => {
    setAdvantages((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const handleAddAdvantage = () => {
    setAdvantages((current) =>
      current.length >= MAX_ADVANTAGES ? current : [...current, { icon: "", title: "", text: "" }],
    );
  };

  const handleRemoveAdvantage = (index: number) => {
    setAdvantages((current) =>
      current.length <= MIN_ADVANTAGES ? current : current.filter((_, i) => i !== index),
    );
  };

  const handleIconUpload = async (index: number, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append("images", file);
      const result = await apiFetch<{ urls: string[] }>("/products/upload", {
        method: "POST",
        body: formData,
      });
      const [url] = result.urls;
      if (url) updateAdvantage(index, "icon", url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить иконку");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (phone && !isValidPhone(phone)) {
      setError("Введите корректный номер телефона");
      return;
    }

    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const saved = await apiFetch<AboutContent>("/about", {
        method: "PUT",
        body: JSON.stringify({ title, description, advantages, phone, email }),
      });
      setTitle(saved.title);
      setDescription(saved.description);
      setAdvantages(saved.advantages);
      setPhone(formatPhoneInput(saved.phone));
      setEmail(saved.email);
      setNotice("Изменения сохранены");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить изменения");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <p className="font-lunar text-caption tracking-caption text-stone">Загрузка…</p>;
  }

  if (loadError) {
    return <p className="font-lunar text-caption tracking-caption text-stone">{loadError}</p>;
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex max-w-[480px] flex-col gap-16"
    >
      <h1 className="font-lunar text-subheading tracking-subheading text-obsidian">О магазине</h1>

      <label className="flex flex-col gap-8">
        <span className="font-lunar text-caption tracking-caption text-stone">Заголовок</span>
        <Input required value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>

      <label className="flex flex-col gap-8">
        <span className="font-lunar text-caption tracking-caption text-stone">Основной текст</span>
        <Input
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <div className="flex flex-col gap-16 rounded-lg bg-bone p-16">
        <span className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian">
          Преимущества
        </span>
        {advantages.map((advantage, index) => (
          <div key={index} className="flex flex-col gap-8 border-b border-ash pb-16 last:border-0">
            <div className="flex items-center gap-8">
              {advantage.icon && (
                // eslint-disable-next-line @next/next/no-img-element -- превью произвольных Cloudinary/статических URL, next/image тут не нужен
                <img src={advantage.icon} alt="" className="h-32 w-32 object-contain" />
              )}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingIndex === index}
                onChange={(event) => void handleIconUpload(index, event.target.files)}
                className="font-lunar text-caption tracking-caption text-stone"
              />
            </div>
            {uploadingIndex === index && (
              <span className="font-lunar text-caption tracking-caption text-stone">Загрузка…</span>
            )}
            <Input
              required
              value={advantage.title}
              onChange={(event) => updateAdvantage(index, "title", event.target.value)}
              placeholder="Заголовок"
            />
            <Input
              required
              value={advantage.text}
              onChange={(event) => updateAdvantage(index, "text", event.target.value)}
              placeholder="Текст"
            />
            <Button
              type="button"
              variant="ghost"
              className="self-start"
              disabled={advantages.length <= MIN_ADVANTAGES}
              onClick={() => handleRemoveAdvantage(index)}
            >
              Удалить преимущество
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="self-start"
          disabled={advantages.length >= MAX_ADVANTAGES}
          onClick={handleAddAdvantage}
        >
          Добавить преимущество
        </Button>
      </div>

      <label className="flex flex-col gap-8">
        <span className="font-lunar text-caption tracking-caption text-stone">Телефон</span>
        <Input
          required
          type="tel"
          inputMode="tel"
          maxLength={17}
          pattern={PHONE_PATTERN}
          title="Номер в формате +380 50 123 45 67"
          value={phone}
          onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
          placeholder="+380 50 123 45 67"
        />
      </label>

      <label className="flex flex-col gap-8">
        <span className="font-lunar text-caption tracking-caption text-stone">Email</span>
        <Input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      {error && <p className="font-lunar text-caption tracking-caption text-stone">{error}</p>}
      {notice && <p className="font-lunar text-caption tracking-caption text-stone">{notice}</p>}

      <Button type="submit" variant="primary" className="self-start" disabled={isSubmitting}>
        Сохранить
      </Button>
    </form>
  );
}
