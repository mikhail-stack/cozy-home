import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";
import { maxCartQuantity } from "@/lib/stock";
import { apiFetch } from "@/lib/api";
import { adaptProduct, type ApiProduct } from "@/lib/adapt-product";
import { useAuthStore } from "@/store/auth.store";

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

interface ServerCartResponse {
  items: { product: ApiProduct; quantity: number }[];
}

function isAuthenticated(): boolean {
  return useAuthStore.getState().accessToken !== null;
}

function applyServerCart(response: ServerCartResponse): void {
  useCartStore.getState().replaceItems(
    response.items.map((item) => ({
      product: adaptProduct(item.product),
      quantity: item.quantity,
    })),
  );
}

// Для гостя локальный Zustand (persist в localStorage) — единственная правда.
// Для авторизованного — сервер: локальное состояние обновляется оптимистично
// (синхронно, этого ждут существующие тесты и e2e/cart.spec.ts), а запрос к
// бэкенду уходит в фоне и результатом ответа подчищает расхождение (например,
// по остатку на складе). Если запрос не удался — перечитываем серверную
// корзину целиком, чтобы не разойтись с реальным состоянием молча.
function syncToServer(request: () => Promise<ServerCartResponse>): void {
  if (!isAuthenticated()) return;
  request()
    .then(applyServerCart)
    .catch((error: unknown) => {
      console.error("Не удалось синхронизировать корзину с сервером", error);
      apiFetch<ServerCartResponse>("/cart")
        .then(applyServerCart)
        .catch(() => undefined);
    });
}

// Корзина гостя хранится в localStorage (persist). Для авторизованных
// пользователей источником истины является сервер (docs/architecture.md,
// раздел 5) — см. syncToServer выше и loadServerCart ниже.
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        let appliedQuantity = 0;
        set((state) => {
          const existing = state.items.find((item) => item.product.id === product.id);
          if (existing) {
            const nextQuantity = Math.min(existing.quantity + quantity, maxCartQuantity(product));
            appliedQuantity = nextQuantity - existing.quantity;
            return {
              items: state.items.map((item) =>
                item.product.id === product.id ? { ...item, quantity: nextQuantity } : item,
              ),
            };
          }
          appliedQuantity = Math.min(quantity, maxCartQuantity(product));
          return {
            items: [...state.items, { product, quantity: appliedQuantity }],
          };
        });
        if (appliedQuantity > 0) {
          syncToServer(() =>
            apiFetch<ServerCartResponse>("/cart/items", {
              method: "POST",
              body: JSON.stringify({ productId: product.id, quantity: appliedQuantity }),
            }),
          );
        }
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
        syncToServer(() =>
          apiFetch<ServerCartResponse>(`/cart/items/${productId}`, { method: "DELETE" }),
        );
      },
      setQuantity: (productId, quantity) => {
        let resolvedQuantity = 0;
        set((state) => ({
          items: state.items
            .map((item) => {
              if (item.product.id !== productId) return item;
              resolvedQuantity = Math.min(quantity, maxCartQuantity(item.product));
              return { ...item, quantity: resolvedQuantity };
            })
            .filter((item) => item.quantity > 0),
        }));
        syncToServer(() =>
          resolvedQuantity > 0
            ? apiFetch<ServerCartResponse>(`/cart/items/${productId}`, {
                method: "PATCH",
                body: JSON.stringify({ quantity: resolvedQuantity }),
              })
            : apiFetch<ServerCartResponse>(`/cart/items/${productId}`, { method: "DELETE" }),
        );
      },
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

// Подхватывает серверную корзину авторизованного пользователя — вызывается
// после восстановления сессии по refresh-куке (SessionBootstrap), чтобы при
// обычной перезагрузке страницы не показывать пустую/устаревшую локальную
// корзину вместо настоящей. После логина/регистрации вместо этого вызывается
// mergeGuestCartIntoServer() (lib/sync-cart.ts) — он уже сам обновляет стор.
export async function loadServerCart(): Promise<void> {
  if (!isAuthenticated()) return;
  try {
    applyServerCart(await apiFetch<ServerCartResponse>("/cart"));
  } catch (error) {
    console.error("Не удалось загрузить корзину", error);
  }
}
