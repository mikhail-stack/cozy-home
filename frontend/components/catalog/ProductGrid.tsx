import type { Product } from "@/types/product";
import { ProductCard } from "@/components/catalog/ProductCard";

interface ProductGridProps {
  products: Product[];
}

// Карточки — отдельные Surface-поверхности с отступом между собой
// (docs/DESIGN.md), не сетка со швами, как в прошлой версии системы.
export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="py-32 text-center text-body text-ink/70">
        В этой категории пока нет товаров.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-24 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
