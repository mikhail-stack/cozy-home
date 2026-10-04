import { apiFetch } from "@/lib/api";
import { adaptProduct, type ApiProduct } from "@/lib/adapt-product";
import { useCartStore } from "@/store/cart.store";

interface MergeResponse {
  items: { product: ApiProduct; quantity: number }[];
  skipped: string[];
}

// После входа/регистрации гостевая корзина (localStorage) сливается с
// серверной корзиной аккаунта (ТЗ, раздел 5) через серверный эндпоинт
// POST /api/cart/merge — он же ограничивает количество остатком и
// возвращает id товаров, которые добавить не получилось (закончились или
// удалены, backend/src/modules/cart/cart.service.ts). Пустая гостевая
// корзина не требует запроса вовсе.
export async function mergeGuestCartIntoServer(): Promise<string[]> {
  const localItems = useCartStore.getState().items;
  if (localItems.length === 0) return [];

  const result = await apiFetch<MergeResponse>("/cart/merge", {
    method: "POST",
    body: JSON.stringify({
      items: localItems.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
    }),
  });

  useCartStore
    .getState()
    .replaceItems(
      result.items.map((item) => ({
        product: adaptProduct(item.product),
        quantity: item.quantity,
      })),
    );
  return result.skipped;
}
