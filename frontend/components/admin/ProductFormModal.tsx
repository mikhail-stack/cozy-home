"use client";

import { useRef, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { ProductCategory } from "@/types/product";
import type { ApiProduct } from "@/lib/adapt-product";
import { withDerivedInStock } from "@/lib/stock";
import { apiFetch, ApiError } from "@/lib/api";

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: "candles", label: "Свечи и ароматы" },
  { value: "textile", label: "Текстиль" },
  { value: "kitchen", label: "Посуда и кухня" },
  { value: "decor", label: "Декор" },
];

const selectClasses =
  "w-full rounded-lg border border-graphite bg-ash px-16 py-12 font-lunar text-body-sm tracking-body-sm text-obsidian focus:border-cobalt-ink focus:outline-none";

// То, что реально уходит в POST/PATCH /api/products (backend/src/modules/products/products.schemas.ts).
export interface ProductDraft {
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  images: string[];
  inStock: boolean;
  stock: number | null;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (draft: ProductDraft) => Promise<void>;
  product: ApiProduct | null;
}

// Поля инициализируются из `product` один раз при монтировании — чтобы
// форма сбрасывалась при переключении между товарами/созданием нового,
// родитель передаёт `key={editingProduct?.id ?? "new"}` при рендере.
export function ProductFormModal({ isOpen, onClose, onSave, product }: ProductFormModalProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? "candles");
  const [inStock, setInStock] = useState(product?.inStock ?? true);
  // Пустое поле — остаток не учитывается (как в ТЗ: только чекбокс «В наличии»).
  const [stock, setStock] = useState(product?.stock != null ? String(product.stock) : "");
  const isStockTracked = stock.trim() !== "";
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of files) formData.append("images", file);
      const result = await apiFetch<{ urls: string[] }>("/products/upload", {
        method: "POST",
        body: formData,
      });
      setImages((current) => [...current, ...result.urls]);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Не удалось загрузить фото");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSave(
        withDerivedInStock({
          name,
          description,
          price: Number(price),
          category,
          images,
          inStock,
          stock: isStockTracked ? Number(stock) : null,
        }),
      );
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "Не удалось сохранить товар");
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-16">
        <div className="flex items-center justify-between">
          <span className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian">
            {product ? "Редактировать товар" : "Новый товар"}
          </span>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="text-obsidian">
            ✕
          </button>
        </div>

        <label className="flex flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">Название</span>
          <Input required value={name} onChange={(event) => setName(event.target.value)} />
        </label>

        <label className="flex flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">Описание</span>
          <Input
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">Цена, грн</span>
          <Input
            required
            type="number"
            min={0}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">Категория</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as ProductCategory)}
            className={selectClasses}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">Фото</span>
          {images.length > 0 && (
            <ul className="flex flex-wrap gap-8">
              {images.map((url) => (
                <li key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- превью произвольных Cloudinary-URL, next/image тут не нужен */}
                  <img src={url} alt="" className="h-[64px] w-[64px] object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((current) => current.filter((item) => item !== url))}
                    aria-label="Удалить фото"
                    className="absolute -right-8 -top-8 flex h-20 w-20 items-center justify-center rounded-full bg-obsidian text-canvas-white"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={isUploading}
            onChange={(event) => void handleFiles(event.target.files)}
            className="font-lunar text-caption tracking-caption text-stone"
          />
          {isUploading && (
            <span className="font-lunar text-caption tracking-caption text-stone">Загрузка…</span>
          )}
        </div>

        <label className="flex flex-col gap-8">
          <span className="font-lunar text-caption tracking-caption text-stone">
            Остаток на складе, шт. (пусто — не учитывать)
          </span>
          <Input
            type="number"
            min={0}
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            placeholder="Не учитывать"
          />
        </label>

        <label className="flex items-center gap-8 font-lunar text-caption tracking-caption text-stone">
          <input
            type="checkbox"
            checked={isStockTracked ? Number(stock) > 0 : inStock}
            disabled={isStockTracked}
            onChange={(event) => setInStock(event.target.checked)}
            className="accent-cobalt-ink"
          />
          В наличии
        </label>

        {error && <p className="font-lunar text-caption tracking-caption text-stone">{error}</p>}

        <Button type="submit" variant="primary" disabled={isSubmitting || isUploading}>
          Сохранить
        </Button>
      </form>
    </Modal>
  );
}
