"use client";

import { useMemo, useState } from "react";
import type { Product, ProductCategory } from "@/types/product";
import { CategoryFilter } from "@/components/catalog/CategoryFilter";
import { ProductGrid } from "@/components/catalog/ProductGrid";

type CategoryOption = "all" | ProductCategory;

const CATEGORIES: { value: CategoryOption; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "candles", label: "Свечи" },
  { value: "textile", label: "Текстиль" },
  { value: "kitchen", label: "Посуда" },
  { value: "decor", label: "Декор" },
];

interface ProductCatalogProps {
  products: Product[];
}

export function ProductCatalog({ products }: ProductCatalogProps) {
  const [category, setCategory] = useState<CategoryOption>("all");

  const filtered = useMemo(
    () => (category === "all" ? products : products.filter((product) => product.category === category)),
    [products, category]
  );

  return (
    <div className="flex flex-col gap-32">
      <CategoryFilter categories={CATEGORIES} selected={category} onSelect={setCategory} />
      <ProductGrid products={filtered} />
    </div>
  );
}
