"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/types/product";
import { useCartStore } from "@/store/cart.store";
import { Button } from "@/components/ui/Button";

interface ProductCardProps {
  product: Product;
}

// По мотивам "Feature Card" из docs/DESIGN.md: фото сверху без рамки и
// тени ("the image is the visual frame"), 0px радиус на изображении
// (editorial-контент остаётся резким), текст под фото. Фото —
// буквенная заглушка на Bone (реальные фото — после Cloudinary, backend,
// пункт 16 плана).
export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1000);
  };

  return (
    <div className="flex flex-col gap-16">
      <Link href={`/products/${product.id}`} className="flex flex-col gap-16">
        <div className="flex aspect-square items-center justify-center bg-bone">
          <span className="font-lunar text-heading-sm tracking-heading-sm text-obsidian">
            {product.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col gap-4">
          <span className="font-lunar text-body-sm tracking-body-sm text-obsidian">{product.name}</span>
          <span className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian">
            {product.price} грн
          </span>
        </div>
      </Link>

      <Button variant="primary" onClick={handleAddToCart} className="w-full">
        {justAdded ? "✓ Добавлено" : "В корзину"}
      </Button>
    </div>
  );
}
