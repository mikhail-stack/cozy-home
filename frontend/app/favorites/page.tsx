"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { adaptProduct, type ApiProduct } from "@/lib/adapt-product";
import { useFavoritesStore } from "@/store/favorites.store";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import type { Product } from "@/types/product";

// Раздел не описан в docs/cozy-home-tz.md (там нет ни сущности, ни
// сценария избранного) — добавлен по запросу в чате. Список id — только
// localStorage (favorites.store), без серверной синхронизации для
// авторизованных пользователей; сами товары теперь — реальный API (по
// одному запросу на id, batch-эндпоинта для списка id в backend нет).
// Товар, который успели удалить, молча пропускается.
export default function FavoritesPage() {
  const favoriteIds = useFavoritesStore((state) => state.productIds);
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      favoriteIds.map((id) =>
        fetch(`${API_URL}/products/${id}`, { cache: "no-store" }).then((res) =>
          res.ok ? (res.json() as Promise<ApiProduct>) : null,
        ),
      ),
    ).then((results) => {
      if (!cancelled) {
        setProducts(results.filter((item) => item !== null).map(adaptProduct));
      }
    });
    return () => {
      cancelled = true;
    };
    // favoriteIds — новый массив при каждом изменении стора; сравнение по
    // длине и join — чтобы эффект не перезапускался от смены ссылки с тем
    // же содержимым (persist-гидратация Zustand).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteIds.length, favoriteIds.join(",")]);

  return (
    <div className="flex flex-col gap-24 px-24 py-32">
      <h1 className="font-lunar text-subheading tracking-subheading text-obsidian">Избранное</h1>

      {products === null ? (
        <p className="font-lunar text-body-sm tracking-body-sm text-stone">Загрузка…</p>
      ) : products.length === 0 ? (
        <p className="font-lunar text-body-sm tracking-body-sm text-stone">
          Пока пусто — добавляйте товары сердечком на карточке или странице товара.
        </p>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
