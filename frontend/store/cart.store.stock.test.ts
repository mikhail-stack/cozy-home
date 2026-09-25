import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "@/store/cart.store";
import type { Product } from "@/types/product";

const product = (id: string, extra: Partial<Product> = {}): Product => ({
  id,
  name: id,
  category: "decor",
  price: 100,
  description: "",
  inStock: true,
  ...extra,
});
const quantityOf = (id: string) =>
  useCartStore.getState().items.find((item) => item.product.id === id)?.quantity;

beforeEach(() => {
  useCartStore.setState({ items: [] });
  localStorage.clear();
});

describe("cart.store и остаток товара", () => {
  it("addItem не кладёт больше остатка — ни за один вызов, ни суммарно", () => {
    const limited = product("a", { stock: 3 });

    useCartStore.getState().addItem(limited, 5);
    expect(quantityOf("a")).toBe(3);

    useCartStore.getState().addItem(limited, 2);
    expect(quantityOf("a")).toBe(3);
  });

  it("setQuantity тоже упирается в остаток", () => {
    useCartStore.getState().addItem(product("a", { stock: 4 }));
    useCartStore.getState().setQuantity("a", 10);
    expect(quantityOf("a")).toBe(4);
  });

  it("без учёта остатка ограничение — только потолок 99", () => {
    useCartStore.getState().addItem(product("free"), 500);
    expect(quantityOf("free")).toBe(99);
  });
});
