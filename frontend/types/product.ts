export type ProductCategory = "candles" | "textile" | "kitchen" | "decor";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  description: string;
}
