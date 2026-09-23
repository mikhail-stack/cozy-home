import Link from "next/link";
import type { Product, ProductCategory } from "@/types/product";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  candles: "Свечи и ароматы",
  textile: "Текстиль",
  kitchen: "Посуда и кухня",
  decor: "Декор",
};

interface BreadcrumbsProps {
  product: Product;
}

// Категория пока не кликабельна — фильтрация каталога по URL ещё не
// реализована (ProductCatalog хранит выбранную категорию в локальном
// состоянии), делать вид, что ссылка работает, не стали.
export function Breadcrumbs({ product }: BreadcrumbsProps) {
  return (
    <nav className="flex flex-wrap items-center gap-8 font-lunar text-caption tracking-caption text-stone">
      <Link href="/" className="hover:underline">
        Главная
      </Link>
      <span>/</span>
      <span>{CATEGORY_LABELS[product.category]}</span>
      <span>/</span>
      <span className="text-obsidian">{product.name}</span>
    </nav>
  );
}
