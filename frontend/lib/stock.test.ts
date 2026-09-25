import { describe, expect, it } from "vitest";
import {
  availableQuantity,
  MAX_CART_QUANTITY,
  maxCartQuantity,
  withDerivedInStock,
} from "@/lib/stock";

describe("availableQuantity / maxCartQuantity", () => {
  it("остаток не учитывается (null/undefined) — без ограничения по остатку, но не выше потолка", () => {
    expect(availableQuantity({ inStock: true, stock: null })).toBe(Infinity);
    expect(availableQuantity({ inStock: true })).toBe(Infinity);
    expect(maxCartQuantity({ inStock: true, stock: null })).toBe(MAX_CART_QUANTITY);
  });

  it("учёт по остатку: берём меньшее из остатка и потолка", () => {
    expect(maxCartQuantity({ inStock: true, stock: 3 })).toBe(3);
    expect(maxCartQuantity({ inStock: true, stock: 500 })).toBe(MAX_CART_QUANTITY);
  });

  it("снятый с наличия и нулевой остаток — 0", () => {
    expect(maxCartQuantity({ inStock: false, stock: 10 })).toBe(0);
    expect(maxCartQuantity({ inStock: false })).toBe(0);
    expect(maxCartQuantity({ inStock: true, stock: 0 })).toBe(0);
  });
});

describe("withDerivedInStock", () => {
  it("числовой остаток главнее переданного inStock", () => {
    expect(withDerivedInStock({ stock: 0, inStock: true }).inStock).toBe(false);
    expect(withDerivedInStock({ stock: 2, inStock: false }).inStock).toBe(true);
  });

  it("без числового остатка inStock не меняется", () => {
    expect(withDerivedInStock({ stock: null, inStock: false }).inStock).toBe(false);
    expect(withDerivedInStock({ inStock: true }).inStock).toBe(true);
  });
});
