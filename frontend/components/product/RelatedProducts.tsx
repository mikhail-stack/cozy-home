import type { Product } from "@/types/product";
import { ProductCard } from "@/components/catalog/ProductCard";

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="flex flex-col gap-24">
      <h2 className="font-lunar text-heading-sm tracking-heading-sm text-obsidian">Похожие товары</h2>
      <div className="grid grid-cols-2 gap-24 sm:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
