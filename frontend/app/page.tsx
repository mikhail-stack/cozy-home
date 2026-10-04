import { ProductCatalog } from "@/components/catalog/ProductCatalog";
import { Hero } from "@/components/home/Hero";
import { API_URL } from "@/lib/api";
import { adaptProduct, type ApiProduct } from "@/lib/adapt-product";

// Server Component — публичный каталог не требует токена, поэтому обычный
// fetch вместо apiFetch (он читает accessToken из Zustand, недоступного
// вне клиентских компонентов). `cache: "no-store"` — наличие и остаток
// должны быть актуальными на каждый заход, не кешем билда/CDN.
async function loadProducts(): Promise<ApiProduct[]> {
  const res = await fetch(`${API_URL}/products`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Не удалось загрузить каталог: ${res.status}`);
  return (await res.json()) as ApiProduct[];
}

export default async function HomePage() {
  let products: ApiProduct[] = [];
  let loadFailed = false;
  try {
    products = await loadProducts();
  } catch {
    loadFailed = true;
  }

  return (
    <>
      <Hero />

      <section id="catalog" className="px-24 py-32">
        {loadFailed ? (
          <p className="font-lunar text-body-sm tracking-body-sm text-stone">
            Не удалось загрузить каталог. Попробуйте обновить страницу.
          </p>
        ) : (
          <ProductCatalog products={products.map(adaptProduct)} />
        )}
      </section>
    </>
  );
}
