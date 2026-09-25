import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  productIds: string[];
  toggle: (productId: string) => void;
}

// Избранное не описано в docs/cozy-home-tz.md (нет ни сущности, ни
// сценария) — фича добавлена по запросу в чате. Пока только
// localStorage (persist), без серверной синхронизации для
// авторизованных пользователей — по аналогии с гостевой корзиной
// (cart.store.ts), но без варианта "для авторизованных" в ТЗ это же
// и единственный источник истины.
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      productIds: [],
      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
    }),
    { name: "cozy-home-favorites" },
  ),
);
