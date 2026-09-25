import type { Product } from "@/types/product";

// Потолок на одну строку корзины — такой же, как на бэкенде
// (backend/src/modules/cart/cart.schemas.ts, MAX_QUANTITY).
export const MAX_CART_QUANTITY = 99;

// Правила остатка зеркалят бэкенд (backend/src/modules/products/stock.ts):
// stock null/undefined — остаток не учитывается, доступность задаёт только
// inStock; число — точный учёт (см. Product.stock в schema.prisma).
export function availableQuantity(product: Pick<Product, "inStock" | "stock">): number {
  if (!product.inStock) return 0;
  return product.stock ?? Infinity;
}

// Сколько штук товара максимум может лежать в одной строке корзины.
export function maxCartQuantity(product: Pick<Product, "inStock" | "stock">): number {
  return Math.min(MAX_CART_QUANTITY, availableQuantity(product));
}

// Числовой остаток → inStock выводится из него (stock > 0), как на бэкенде.
export function withDerivedInStock<T extends { stock?: number | null; inStock: boolean }>(
  product: T,
): T {
  return typeof product.stock === "number" ? { ...product, inStock: product.stock > 0 } : product;
}
