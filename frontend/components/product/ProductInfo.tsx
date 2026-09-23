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
      <h1 className="font-gp text-subheading tracking-subheading text-soot">{product.name}</h1>
      <p className="font-gp text-body-sm tracking-body-sm text-soot">{product.price} грн</p>
      <p className="font-gp text-body-sm tracking-body-sm text-soot">{product.description}</p>
      <Button variant="solid" onClick={handleAddToCart} className="self-start">
        {justAdded ? "✓ Добавлено" : "В корзину"}
      </Button>
    </div>
  );
}
