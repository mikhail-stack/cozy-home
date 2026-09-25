import { describe, expect, it } from "vitest";
import { mergeCartItems } from "@/lib/merge-cart";
import type { CartItem } from "@/store/cart.store";
import type { Product } from "@/types/product";

function makeProduct(id: string, price = 100): Product {
  return { id, name: `Товар ${id}`, category: "decor", price, description: "", inStock: true };
}

function makeItem(id: string, quantity: number, price = 100): CartItem {
  return { product: makeProduct(id, price), quantity };
}

describe("mergeCartItems", () => {
  it("суммирует количество для совпадающих товаров", () => {
    const merged = mergeCartItems([makeItem("a", 2)], [makeItem("a", 3)]);
    expect(merged).toEqual([expect.objectContaining({ quantity: 5 })]);
  });

  it("сохраняет товары, которые есть только в одном из списков", () => {
    const merged = mergeCartItems([makeItem("local-only", 1)], [makeItem("server-only", 4)]);
    const ids = merged.map((item) => item.product.id).sort();
    expect(ids).toEqual(["local-only", "server-only"]);
  });

  it("возвращает пустой массив для двух пустых корзин", () => {
    expect(mergeCartItems([], [])).toEqual([]);
  });

  it("не мутирует переданные исходные массивы", () => {
    const local = [makeItem("a", 1)];
    const server = [makeItem("a", 1)];
    mergeCartItems(local, server);
    expect(local[0].quantity).toBe(1);
    expect(server[0].quantity).toBe(1);
  });
});
