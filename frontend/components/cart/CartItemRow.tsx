"use client";

import type { CartItem } from "@/store/cart.store";
import { useCartStore } from "@/store/cart.store";

interface CartItemRowProps {
  item: CartItem;
}

// Ash-разделитель между строками — для функционального списка (в отличие
// от маркетинговых карточек) лёгкая граница оставлена ради читаемости,
// аналогично таблицам в админке.
export function CartItemRow({ item }: CartItemRowProps) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <div className="flex gap-12 border-b border-ash px-24 py-16">
      <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center bg-bone">
        <span className="font-lunar text-subheading text-obsidian">
          {item.product.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <span className="font-lunar text-body-sm tracking-body-sm text-obsidian">{item.product.name}</span>
        <span className="font-lunar text-body-sm tracking-body-sm text-obsidian">
          {item.product.price} грн
        </span>

        <div className="mt-4 flex items-center gap-16">
          <div className="flex items-center gap-8 font-lunar text-body-sm tracking-body-sm text-obsidian">
            <button
              type="button"
              onClick={() => setQuantity(item.product.id, item.quantity - 1)}
              aria-label="Уменьшить количество"
            >
              −
            </button>
            <span>{item.quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(item.product.id, item.quantity + 1)}
              aria-label="Увеличить количество"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.product.id)}
            className="font-lunar text-caption tracking-caption text-stone hover:underline"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
