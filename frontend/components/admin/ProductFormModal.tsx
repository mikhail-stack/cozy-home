"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Product, ProductCategory } from "@/types/product";

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: "candles", label: "Свечи и ароматы" },
  { value: "textile", label: "Текстиль" },
  { value: "kitchen", label: "Посуда и кухня" },
  { value: "decor", label: "Декор" },
];

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product: Product | null;
}

// Загрузка фото — заглушка. Реальный аплоад в Cloudinary появится вместе
// с Products-модулем backend (пункт 16 плана).
// Поля инициализируются из `product` один раз при монтировании — чтобы
// форма сбрасывалась при переключении между товарами/созданием нового,
// родитель передаёт `key={editingProduct?.id ?? "new"}` при рендере.
export function ProductFormModal({ isOpen, onClose, onSave, product }: ProductFormModalProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? "candles");
  const [inStock, setInStock] = useState(product?.inStock ?? true);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      id: product?.id ?? `product-${Date.now()}`,
      name,
      description,
      price: Number(price),
      category,
      inStock,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-16">
        <div className="flex items-center justify-between">
          <span className="font-gp text-body-sm tracking-body-sm text-soot">
            {product ? "Редактировать товар" : "Новый товар"}
          </span>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="text-soot">
            ✕
          </button>
        </div>

        <label className="flex flex-col gap-6">
          <span className="font-gp text-caption tracking-caption text-soot">Название</span>
          <Input required value={name} onChange={(event) => setName(event.target.value)} />
        </label>

        <label className="flex flex-col gap-6">
          <span className="font-gp text-caption tracking-caption text-soot">Описание</span>
          <Input required value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>

        <label className="flex flex-col gap-6">
          <span className="font-gp text-caption tracking-caption text-soot">Цена, грн</span>
          <Input
            required
            type="number"
            min={0}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-6">
          <span className="font-gp text-caption tracking-caption text-soot">Категория</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as ProductCategory)}
            className="border-0 border-b border-soot bg-transparent px-0 py-7 font-gp text-body-sm tracking-body-sm text-soot focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-6">
          <span className="font-gp text-caption tracking-caption text-soot">Фото</span>
          <div className="border border-dashed border-soot px-16 py-16 text-center font-gp text-caption tracking-caption text-soot">
            Загрузка появится вместе с Cloudinary (backend)
          </div>
        </div>

        <label className="flex items-center gap-8 font-gp text-caption tracking-caption text-soot">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(event) => setInStock(event.target.checked)}
            className="accent-soot"
          />
          В наличии
        </label>

        <Button type="submit" variant="solid">
          Сохранить
        </Button>
      </form>
    </Modal>
  );
}
