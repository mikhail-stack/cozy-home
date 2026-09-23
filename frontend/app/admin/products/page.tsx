"use client";

import { useState } from "react";
import { PRODUCTS as INITIAL_PRODUCTS } from "@/lib/mock-products";
import { ProductFormModal } from "@/components/admin/ProductFormModal";
import { Button } from "@/components/ui/Button";
import type { Product, ProductCategory } from "@/types/product";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  candles: "Свечи и ароматы",
  textile: "Текстиль",
  kitchen: "Посуда и кухня",
  decor: "Декор",
};

// Данные и все действия — только в состоянии компонента, между
// перезагрузками не сохраняются. Реальный CRUD появится вместе с
// Products-модулем backend (пункт 16 плана).
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const openCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleSave = (product: Product) => {
    setProducts((current) => {
      const exists = current.some((item) => item.id === product.id);
      return exists
        ? current.map((item) => (item.id === product.id ? product : item))
        : [...current, product];
    });
    setModalOpen(false);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`Удалить «${product.name}»?`)) {
      setProducts((current) => current.filter((item) => item.id !== product.id));
    }
  };

  return (
    <div className="flex flex-col gap-24">
      <div className="flex items-center justify-between">
        <h1 className="font-lunar text-subheading tracking-subheading text-obsidian">Товары</h1>
        <Button variant="primary" onClick={openCreate}>
          Добавить товар
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-lunar text-body-sm tracking-body-sm text-obsidian">
          <thead>
            <tr className="border-b border-ash text-left">
              <th className="py-8 pr-16">Фото</th>
              <th className="py-8 pr-16">Название</th>
              <th className="py-8 pr-16">Категория</th>
              <th className="py-8 pr-16">Цена</th>
              <th className="py-8 pr-16">Наличие</th>
              <th className="py-8">Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-ash">
                <td className="py-8 pr-16">
                  <div className="flex h-[40px] w-[40px] items-center justify-center bg-bone">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                </td>
                <td className="py-8 pr-16">{product.name}</td>
                <td className="py-8 pr-16">{CATEGORY_LABELS[product.category]}</td>
                <td className="py-8 pr-16">{product.price} грн</td>
                <td className="py-8 pr-16">{product.inStock ? "В наличии" : "Нет в наличии"}</td>
                <td className="py-8 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="mr-16 hover:underline"
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product)}
                    className="hover:underline"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProductFormModal
        key={editingProduct?.id ?? "new"}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        product={editingProduct}
      />
    </div>
  );
}
