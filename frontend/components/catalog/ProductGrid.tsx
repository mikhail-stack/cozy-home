import type { Product } from "@/types/product";
import { ProductCard } from "@/components/catalog/ProductCard";

interface ProductGridProps {
  products: Product[];
}

// Без hairline-рамок между карточками — отступы вместо бордеров
// ("Do not add borders to ... image containers", docs/DESIGN.md).
export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="py-32 text-center font-lunar text-body-sm tracking-body-sm text-stone">
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
