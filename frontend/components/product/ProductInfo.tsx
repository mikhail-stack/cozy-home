"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { useCartStore } from "@/store/cart.store";
import { maxCartQuantity } from "@/lib/stock";
import { Button } from "@/components/ui/Button";
import { FavoriteButton } from "@/components/ui/FavoriteButton";

interface ProductInfoProps {
  product: Product;
}

// Клик «В корзину» не открывает drawer автоматически — по сценарию
// из docs/cozy-home-tz.md, раздел 4.2. Характеристики, выбор количества
// и избранное в ТЗ не описаны (сущность Product там без этих полей,
// сценария избранного нет вовсе) — добавлены по запросу в чате.
// Характеристики — hairline-список (border-ash), как в функциональных
// списках корзины/админки, а не маркетинговая карточка.
export function ProductInfo({ product }: ProductInfoProps) {
  const addItem = useCartStore((state) => state.addItem);
  const inCart = useCartStore(
    (state) => state.items.find((item) => item.product.id === product.id)?.quantity ?? 0,
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // Сколько ещё можно положить с учётом остатка и того, что уже в корзине
  // (см. lib/stock.ts). Выбранное количество не может его превысить.
  const remaining = maxCartQuantity(product) - inCart;
  const canAdd = remaining > 0;
  const selected = Math.min(quantity, Math.max(remaining, 1));

  const handleAddToCart = () => {
    addItem(product, selected);
    setQuantity(1);
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

      {product.specs && (
        <dl className="flex flex-col">
          {product.specs.map((spec) => (
            <div
              key={spec.label}
              className="flex items-center justify-between border-b border-ash py-8"
            >
              <dt className="font-lunar text-caption tracking-caption text-stone">{spec.label}</dt>
              <dd className="font-lunar text-body-sm tracking-body-sm text-obsidian">
                {spec.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {!product.inStock && (
        <p className="font-lunar text-caption tracking-caption text-stone">Нет в наличии</p>
      )}
      {product.inStock && typeof product.stock === "number" && product.stock <= 5 && (
        <p className="font-lunar text-caption tracking-caption text-stone">
          Осталось {product.stock} шт.
        </p>
      )}

      <div className="flex items-center gap-16">
        <div className="flex items-center gap-12 rounded-md border border-obsidian px-16 py-12">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, selected - 1))}
            disabled={!canAdd}
            aria-label="Уменьшить количество"
            className="font-lunar text-body-sm tracking-body-sm text-obsidian disabled:opacity-50"
          >
            −
          </button>
          <span className="inline-block w-16 text-center font-lunar text-body-sm tracking-body-sm tabular-nums text-obsidian">
            {selected}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(remaining, selected + 1))}
            disabled={!canAdd || selected >= remaining}
            aria-label="Увеличить количество"
            className="font-lunar text-body-sm tracking-body-sm text-obsidian disabled:opacity-50"
          >
            +
          </button>
        </div>

        <Button
          variant="primary"
          onClick={handleAddToCart}
          disabled={!canAdd}
          className="self-start"
        >
          {justAdded
            ? "✓ Добавлено"
            : product.inStock && !canAdd
              ? "Максимум в корзине"
              : "В корзину"}
        </Button>

        <FavoriteButton
          productId={product.id}
          className="h-48 w-48 shrink-0 rounded-md border border-obsidian"
        />
      </div>
    </div>
  );
}
