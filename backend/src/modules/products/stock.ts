// Правила остатка в одном месте (см. комментарий у Product.stock в
// schema.prisma): stock === null — остаток не учитывается, доступность
// задаёт только inStock; число — точный учёт.

interface Stockable {
  inStock: boolean;
  stock: number | null;
}

// Сколько штук можно положить в корзину. Infinity — без ограничения по
// остатку (не учитывается); 0 — недоступен.
export function availableQuantity(product: Stockable): number {
  if (!product.inStock) return 0;
  return product.stock ?? Infinity;
}

// Учёт остатка задан числом → inStock выводится из него: stock > 0.
// Так витрина (которая смотрит на inStock) не расходится с остатком, а
// заказ, обнуливший остаток, сам «снимает» товар с наличия. Значение
// inStock, пришедшее вместе с числовым stock, игнорируется — источник
// истины остаток. При stock: null (учёт выключен) inStock остаётся как есть.
export function withDerivedInStock<T extends { stock?: number | null; inStock?: boolean }>(
  input: T,
): T & { inStock?: boolean } {
  return typeof input.stock === "number" ? { ...input, inStock: input.stock > 0 } : input;
}
