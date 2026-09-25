import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore, selectCartCount, selectCartTotal } from "@/store/cart.store";
import type { Product } from "@/types/product";

function makeProduct(id: string, price: number): Product {
  return { id, name: `Товар ${id}`, category: "decor", price, description: "", inStock: true };
}

// Стор — синглтон с persist в localStorage, поэтому состояние сбрасываем
// перед каждым тестом, иначе тесты будут влиять друг на друга.
beforeEach(() => {
  useCartStore.setState({ items: [] });
  localStorage.clear();
});

describe("cart.store", () => {
  it("addItem добавляет новый товар с количеством 1 по умолчанию", () => {
    useCartStore.getState().addItem(makeProduct("a", 100));
    expect(useCartStore.getState().items).toMatchObject([{ product: { id: "a" }, quantity: 1 }]);
  });

  it("addItem увеличивает количество, если товар уже в корзине", () => {
    const product = makeProduct("a", 100);
    useCartStore.getState().addItem(product);
    useCartStore.getState().addItem(product);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("addItem принимает явное количество (выбор на странице товара)", () => {
    useCartStore.getState().addItem(makeProduct("a", 100), 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it("removeItem убирает товар из корзины", () => {
    useCartStore.getState().addItem(makeProduct("a", 100));
    useCartStore.getState().removeItem("a");
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("setQuantity с количеством 0 или меньше удаляет товар", () => {
    useCartStore.getState().addItem(makeProduct("a", 100));
    useCartStore.getState().setQuantity("a", 0);
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("selectCartCount суммирует количество по всем товарам", () => {
    useCartStore.getState().addItem(makeProduct("a", 100), 2);
    useCartStore.getState().addItem(makeProduct("b", 50), 3);
    expect(selectCartCount(useCartStore.getState())).toBe(5);
  });

  it("selectCartTotal считает сумму количество × цена", () => {
    useCartStore.getState().addItem(makeProduct("a", 100), 2);
    useCartStore.getState().addItem(makeProduct("b", 50), 3);
    expect(selectCartTotal(useCartStore.getState())).toBe(100 * 2 + 50 * 3);
  });
});
