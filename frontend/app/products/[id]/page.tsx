import { notFound } from "next/navigation";
import { PRODUCTS } from "@/lib/mock-products";
import { Breadcrumbs } from "@/components/product/Breadcrumbs";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { RelatedProducts } from "@/components/product/RelatedProducts";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = PRODUCTS.find((item) => item.id === id);

  if (!product) {
    notFound();
  }

  const related = PRODUCTS.filter(
    (item) => item.category === product.category && item.id !== product.id,
  ).slice(0, 4);

  return (
    <div className="flex flex-col gap-32 px-24 py-32">
      <Breadcrumbs product={product} />

      <div className="grid gap-32 md:grid-cols-2">
        <ProductGallery letter={product.name.charAt(0).toUpperCase()} images={product.images} />
        <ProductInfo product={product} />
      </div>

      <RelatedProducts products={related} />
    </div>
  );
}
