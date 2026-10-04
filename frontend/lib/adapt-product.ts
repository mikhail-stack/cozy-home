import type { Product, ProductCategory } from "@/types/product";

// Форма ответа backend (backend/src/modules/products/products.service.ts) —
// Prisma-модель Product как есть: фото плоским списком, без specs (в ТЗ их
// нет у Product вообще — см. комментарий в lib/mock-products.ts).
export interface ApiProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  images: string[];
  inStock: boolean;
  stock: number | null;
  createdAt: string;
}

// Backend хранит фото плоским списком, а фронтенд раскладывает их по трём
// слотам галереи (main/detail/interior, ProductGallery) — как раньше
// lib/mock-products.ts вручную дублировало одно фото на все три слота.
// Без фото — undefined: карточка и галерея показывают буквенную заглушку
// (The Letter System, docs/DESIGN.md).
export function adaptProduct(api: ApiProduct): Product {
  const [main, detail, interior] = api.images;
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    price: api.price,
    category: api.category,
    inStock: api.inStock,
    stock: api.stock,
    images: main ? { main, detail: detail ?? main, interior: interior ?? main } : undefined,
  };
}
