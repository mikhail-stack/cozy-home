import type { CartItem } from "@/store/cart.store";

// Объединяет гостевую корзину (localStorage) с серверной корзиной
// аккаунта при входе — совпадающие товары суммируют количество
// (docs/cozy-home-tz.md, раздел 5). Вызов из реального сценария логина
// (cartStore.replaceItems(mergeCartItems(...))) появится вместе с
// Auth-модулем backend (пункт 15) и серверной корзиной (Cart-модуль,
// пункт 17) — пока серверной корзины не существует, звать эту функцию
// неоткуда.
export function mergeCartItems(localItems: CartItem[], serverItems: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>();

  for (const item of serverItems) {
    merged.set(item.product.id, { ...item });
  }

  for (const item of localItems) {
    const existing = merged.get(item.product.id);
    merged.set(
      item.product.id,
      existing ? { ...existing, quantity: existing.quantity + item.quantity } : { ...item }
    );
  }

  return Array.from(merged.values());
}
