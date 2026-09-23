import { ProductCatalog } from "@/components/catalog/ProductCatalog";
import { Hero } from "@/components/home/Hero";
import { PRODUCTS } from "@/lib/mock-products";

export default function HomePage() {
  return (
    <>
      <Hero />

      <section id="catalog" className="px-24 py-32">
        <ProductCatalog products={PRODUCTS} />
      </section>
    </>
  );
}
