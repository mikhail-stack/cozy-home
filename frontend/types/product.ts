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
  images?: ProductImages;
  specs?: ProductSpec[];
}
