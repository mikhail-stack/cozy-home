import type { Product } from "@/types/product";
import { ProductCard } from "@/components/catalog/ProductCard";

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="flex flex-col gap-16">
      <h2 className="font-gp text-subheading tracking-subheading text-soot">Похожие товары</h2>
      <div className="grid grid-cols-2 border-r border-b border-soot sm:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
