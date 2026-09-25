export type ProductCategory = "candles" | "textile" | "kitchen" | "decor";

export interface ProductImages {
  main: string;
  detail: string;
  interior: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  description: string;
  inStock: boolean;
  // Остаток на складе. null/не задан — не учитывается (тогда доступность
  // задаёт только inStock); число — точный учёт, см. lib/stock.ts.
  stock?: number | null;
  images?: ProductImages;
  specs?: ProductSpec[];
}
