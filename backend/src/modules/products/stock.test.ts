import { describe, expect, it } from "vitest";
import { availableQuantity, withDerivedInStock } from "./stock.js";

describe("availableQuantity", () => {
  it.each([
    ["остаток не учитывается — без ограничения", { inStock: true, stock: null }, Infinity],
    ["учёт по остатку", { inStock: true, stock: 5 }, 5],
    ["остаток 0", { inStock: true, stock: 0 }, 0],
    ["снят с наличия — недоступен, даже если остаток есть", { inStock: false, stock: 5 }, 0],
    ["снят с наличия без учёта остатка", { inStock: false, stock: null }, 0],
  ])("%s", (_name, product, expected) => {
    expect(availableQuantity(product)).toBe(expected);
  });
});

describe("withDerivedInStock", () => {
  it("числовой остаток задаёт inStock: > 0 — в наличии, 0 — нет", () => {
    expect(withDerivedInStock({ stock: 3 }).inStock).toBe(true);
    expect(withDerivedInStock({ stock: 0 }).inStock).toBe(false);
  });

  it("переданный вместе с остатком inStock игнорируется — источник истины остаток", () => {
    expect(withDerivedInStock({ stock: 0, inStock: true }).inStock).toBe(false);
    expect(withDerivedInStock({ stock: 4, inStock: false }).inStock).toBe(true);
  });

  it("без числового остатка (null/не передан) inStock остаётся как есть", () => {
    expect(withDerivedInStock({ stock: null, inStock: false })).toEqual({
      stock: null,
      inStock: false,
    });
    expect(withDerivedInStock({ inStock: true })).toEqual({ inStock: true });
  });
});
