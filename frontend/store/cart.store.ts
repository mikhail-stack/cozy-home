import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";
import { maxCartQuantity } from "@/lib/stock";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  replaceItems: (items: CartItem[]) => void;
  clear: () => void;
}

// Корзина гостя хранится в localStorage (persist). Для авторизованных
// пользователей источником истины станет сервер — см. docs/architecture.md,
// раздел 5, и lib/merge-cart.ts. `replaceItems` — точка входа для
// результата слияния после логина (вызов появится вместе с Auth-модулем
// backend, пункт 15 плана).
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((item) => item.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? {
                      ...item,
                      quantity: Math.min(item.quantity + quantity, maxCartQuantity(product)),
                    }
                  : item,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { product, quantity: Math.min(quantity, maxCartQuantity(product)) },
            ],
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.product.id === productId
                ? { ...item, quantity: Math.min(quantity, maxCartQuantity(item.product)) }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      replaceItems: (items) => set({ items }),
      clear: () => set({ items: [] }),
    }),
    { name: "cozy-home-cart" },
  ),
);

export const selectCartCount = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartTotal = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
