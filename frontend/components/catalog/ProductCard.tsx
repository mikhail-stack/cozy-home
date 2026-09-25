"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { useCartStore } from "@/store/cart.store";
import { maxCartQuantity } from "@/lib/stock";
import { Button } from "@/components/ui/Button";
import { FavoriteButton } from "@/components/ui/FavoriteButton";

interface ProductCardProps {
  product: Product;
}

// По мотивам "Feature Card" из docs/DESIGN.md: фото сверху без рамки и
// тени ("the image is the visual frame"), 0px радиус на изображении
// (editorial-контент остаётся резким), текст под фото. Фото —
// буквенная заглушка на Bone (реальные фото — после Cloudinary, backend,
// пункт 16 плана). Сердечко избранного — оверлей поверх фото (не описан
// в DESIGN.md), поэтому фото и текст разбиты на два отдельных Link на
// один и тот же /products/:id — кнопка не может быть вложена в <a>.
// Название — flex-1: забирает всю "лишнюю" высоту от grid-стретча ряда,
// поэтому цена всегда сидит вплотную к кнопке и на одной высоте во всех
// карточках ряда, независимо от того, в одну строку название или в две.
// Цена — 18px/800 по запросу в чате (крупнее и жирнее обычного text-body-sm).
// data-testid — для e2e/cart.spec.ts: карточка с фото имеет 2 <Link> с
// одинаковым accessible name (alt у Image = имя товара), по тексту её
// однозначно не найти.
export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const inCart = useCartStore(
    (state) => state.items.find((item) => item.product.id === product.id)?.quantity ?? 0,
  );
  // Недоступный товар и товар, уже взятый в корзину на весь остаток, —
  // кнопка неактивна (правила — lib/stock.ts).
  const canAdd = maxCartQuantity(product) - inCart > 0;
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1000);
  };

  return (
    <div className="flex h-full flex-col gap-16" data-testid={`product-card-${product.id}`}>
      <div className="relative">
        <Link href={`/products/${product.id}`}>
          <div className="relative flex aspect-square items-center justify-center bg-bone">
            {product.images ? (
              <Image
                src={product.images.main}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            ) : (
              <span className="font-lunar text-heading-sm tracking-heading-sm text-obsidian">
                {product.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </Link>
        <FavoriteButton productId={product.id} className="absolute right-8 top-8 h-32 w-32" />
      </div>

      <Link href={`/products/${product.id}`} className="flex flex-1 flex-col">
        <span className="font-lunar text-body-sm tracking-body-sm text-obsidian">
          {product.name}
        </span>
      </Link>

      <div className="flex flex-col gap-8">
        <span className="font-lunar text-[18px] font-[800] text-obsidian">{product.price} грн</span>
        <Button variant="primary" onClick={handleAddToCart} disabled={!canAdd} className="w-full">
          {justAdded ? "✓ Добавлено" : !product.inStock ? "Нет в наличии" : "В корзину"}
        </Button>
      </div>
    </div>
  );
}
