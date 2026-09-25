"use client";

import { useFavoritesStore } from "@/store/favorites.store";

interface FavoriteButtonProps {
  productId: string;
  className: string;
}

// Общий тоггл "избранное" — используется и на карточке каталога
// (оверлей на фото), и на странице товара (кнопка рядом с "В корзину").
// Стилизация (размер/форма/фон) целиком приходит через className от
// вызывающего компонента, здесь только поведение и иконка.
export function FavoriteButton({ productId, className }: FavoriteButtonProps) {
  const isFavorite = useFavoritesStore((state) => state.productIds.includes(productId));
  const toggle = useFavoritesStore((state) => state.toggle);

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
      aria-pressed={isFavorite}
      className={`flex items-center justify-center ${className}`}
    >
      <FavoriteIcon active={isFavorite} />
    </button>
  );
}

function FavoriteIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={active ? "var(--color-cobalt-ink)" : "none"}
      stroke={active ? "var(--color-cobalt-ink)" : "currentColor"}
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        d="M12 20s-7-4.35-9.5-8.5C.8 8.1 2.2 4.5 5.6 4c2-.3 3.7.7 6.4 3 2.7-2.3 4.4-3.3 6.4-3 3.4.5 4.8 4.1 3.1 7.5C19 15.65 12 20 12 20Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
