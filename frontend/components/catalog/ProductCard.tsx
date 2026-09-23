"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/types/product";
import { useCartStore } from "@/store/cart.store";
import { Button } from "@/components/ui/Button";

interface ProductCardProps {
  product: Product;
}

// Фото товара пока заменено буквенным лейблом — приём "The Letter System"
// из docs/DESIGN.md. Реальные фото появятся с загрузкой в Cloudinary
// (backend, пункт 16 плана).
export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1000);
  };

  return (
    <div className="flex flex-col border-t border-l border-soot">
      <Link href={`/products/${product.id}`} className="flex flex-col">
        <div className="flex aspect-square items-center justify-center bg-chalk">
          <span className="font-gp text-heading tracking-heading text-soot">
            {product.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col items-center gap-4 px-13 py-13 text-center">
          <span className="font-gp text-body-sm tracking-body-sm text-soot">{product.name}</span>
          <span className="font-gp text-body-sm tracking-body-sm text-soot">
            {product.price} грн
          </span>
        </div>
      </Link>

      <Button variant="link" onClick={handleAddToCart} className="border-t border-soot py-10">
        {justAdded ? "✓ Добавлено" : "В корзину"}
      </Button>
    </div>
  );
}
