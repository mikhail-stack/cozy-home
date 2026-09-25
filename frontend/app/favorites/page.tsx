"use client";

import { PRODUCTS } from "@/lib/mock-products";
import { useFavoritesStore } from "@/store/favorites.store";
import { ProductGrid } from "@/components/catalog/ProductGrid";

// Раздел не описан в docs/cozy-home-tz.md (там нет ни сущности, ни
// сценария избранного) — добавлен по запросу в чате. Список строится
// фильтрацией PRODUCTS (мок, пункт 23 плана: Products-модуль backend)
// по favorites.store — только localStorage, без серверной синхронизации
// для авторизованных пользователей.
export default function FavoritesPage() {
  const favoriteIds = useFavoritesStore((state) => state.productIds);
  const products = PRODUCTS.filter((product) => favoriteIds.includes(product.id));

  return (
    <div className="flex flex-col gap-24 px-24 py-32">
      <h1 className="font-lunar text-subheading tracking-subheading text-obsidian">Избранное</h1>

      {products.length === 0 ? (
        <p className="font-lunar text-body-sm tracking-body-sm text-stone">
          Пока пусто — добавляйте товары сердечком на карточке или странице товара.
        </p>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
