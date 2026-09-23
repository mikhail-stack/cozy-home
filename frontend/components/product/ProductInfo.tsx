"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { useCartStore } from "@/store/cart.store";
import { Button } from "@/components/ui/Button";

interface ProductInfoProps {
  product: Product;
}

// Клик «В корзину» не открывает drawer автоматически — по сценарию
// из docs/cozy-home-tz.md, раздел 4.2.
export function ProductInfo({ product }: ProductInfoProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1000);
  };

  return (
    <div className="flex flex-col gap-16">
      <h1 className="font-lunar text-heading-sm tracking-heading-sm text-obsidian">
        {product.name}
      </h1>
      <p className="font-lunar text-body tracking-body font-medium text-obsidian">
        {product.price} грн
      </p>
      <p className="font-lunar text-body-sm tracking-body-sm text-stone">{product.description}</p>
      <Button variant="primary" onClick={handleAddToCart} className="self-start">
        {justAdded ? "✓ Добавлено" : "В корзину"}
      </Button>
    </div>
  );
}
