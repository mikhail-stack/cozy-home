"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ProductFormModal, type ProductDraft } from "@/components/admin/ProductFormModal";
import { Button } from "@/components/ui/Button";
import type { ProductCategory } from "@/types/product";
import { apiFetch, ApiError } from "@/lib/api";
import type { ApiProduct } from "@/lib/adapt-product";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  candles: "Свечи и ароматы",
  textile: "Текстиль",
  kitchen: "Посуда и кухня",
  decor: "Декор",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ApiProduct[] | null>(null);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = () =>
    apiFetch<ApiProduct[]>("/products")
      .then(setProducts)
      .catch(() => setProducts([]));

  useEffect(() => {
    void reload();
  }, []);

  const openCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product: ApiProduct) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleSave = async (draft: ProductDraft) => {
    if (editingProduct) {
      await apiFetch(`/products/${editingProduct.id}`, {
        method: "PATCH",
        body: JSON.stringify(draft),
      });
    } else {
      await apiFetch("/products", { method: "POST", body: JSON.stringify(draft) });
    }
    setModalOpen(false);
    void reload();
  };

  const handleDelete = async (product: ApiProduct) => {
    if (!window.confirm(`Удалить «${product.name}»?`)) return;
    setError(null);
    try {
      await apiFetch(`/products/${product.id}`, { method: "DELETE" });
      void reload();
    } catch (error) {
      // 409 — товар есть в заказах (backend/src/modules/products/products.service.ts).
      setError(error instanceof ApiError ? error.message : "Не удалось удалить товар");
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

      {error && <p className="font-lunar text-caption tracking-caption text-stone">{error}</p>}

      {products === null ? (
        <p className="font-lunar text-body-sm tracking-body-sm text-stone">Загрузка…</p>
      ) : (
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
                    {product.images[0] ? (
                      <div className="relative h-[40px] w-[40px]">
                        <Image
                          src={product.images[0]}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-[40px] w-[40px] items-center justify-center bg-bone">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="py-8 pr-16">{product.name}</td>
                  <td className="py-8 pr-16">{CATEGORY_LABELS[product.category]}</td>
                  <td className="py-8 pr-16">{product.price} грн</td>
                  <td className="py-8 pr-16">
                    {product.inStock
                      ? typeof product.stock === "number"
                        ? `В наличии (${product.stock} шт.)`
                        : "В наличии"
                      : "Нет в наличии"}
                  </td>
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
                      onClick={() => void handleDelete(product)}
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
      )}

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
