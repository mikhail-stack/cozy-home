"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/types/product";
import { useCartStore } from "@/store/cart.store";
import { Button } from "@/components/ui/Button";

interface ProductCardProps {
  product: Product;
}

// Фото товара пока заменено буквенной заглушкой на Beige-фоне
// (docs/DESIGN.md, раздел «Фото»). Реальные фото появятся с загрузкой
// в Cloudinary (backend, пункт 16 плана).
export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1000);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-surface shadow-sm">
      <Link href={`/products/${product.id}`} className="flex flex-col">
        <div className="flex aspect-square items-center justify-center bg-beige">
          <span className="font-heading text-heading text-forest">
            {product.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col items-center gap-4 px-16 py-14 text-center">
          <span className="text-body text-ink">{product.name}</span>
          <span className="text-body font-medium text-forest">{product.price} грн</span>
        </div>
      </Link>

      <Button variant="primary" onClick={handleAddToCart} className="mx-16 mb-16 rounded-md">
        {justAdded ? "✓ Добавлено" : "В корзину"}
      </Button>
    </div>
  );
}
