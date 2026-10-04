import { notFound } from "next/navigation";
import { API_URL } from "@/lib/api";
import { adaptProduct, type ApiProduct } from "@/lib/adapt-product";
import { Breadcrumbs } from "@/components/product/Breadcrumbs";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { RelatedProducts } from "@/components/product/RelatedProducts";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function loadProduct(id: string): Promise<ApiProduct | null> {
  const res = await fetch(`${API_URL}/products/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Не удалось загрузить товар: ${res.status}`);
  return (await res.json()) as ApiProduct;
}

async function loadRelated(category: string, excludeId: string): Promise<ApiProduct[]> {
  const res = await fetch(`${API_URL}/products?category=${category}`, { cache: "no-store" });
  if (!res.ok) return [];
  const products = (await res.json()) as ApiProduct[];
  return products.filter((item) => item.id !== excludeId).slice(0, 4);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const apiProduct = await loadProduct(id);
  if (!apiProduct) notFound();

  const product = adaptProduct(apiProduct);
  const related = (await loadRelated(apiProduct.category, apiProduct.id)).map(adaptProduct);

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
