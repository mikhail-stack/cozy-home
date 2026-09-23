import type { Product } from "@/types/product";
import { ProductCard } from "@/components/catalog/ProductCard";

interface ProductGridProps {
  products: Product[];
}

// Каждая карточка рисует свою верхнюю и левую грань (border-t/border-l),
// а контейнер замыкает правую и нижнюю — так hairline-сетка не задваивается
// на стыках и не зависит от числа колонок на разных брейкпоинтах.
export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="py-32 text-center font-gp text-body-sm tracking-body-sm text-soot">
        В этой категории пока нет товаров.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 border-r border-b border-soot sm:grid-cols-3 lg:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
