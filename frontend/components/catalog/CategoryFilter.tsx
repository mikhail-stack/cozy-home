interface CategoryOption<T extends string> {
  value: T;
  label: string;
}

interface CategoryFilterProps<T extends string> {
  categories: CategoryOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

// Горизонтальные пилюли — как в ТЗ (docs/cozy-home-tz.md, 4.1). В прошлой
// версии дизайн-системы радиус был запрещён и пришлось заменять их
// текстовыми ссылками; новая система скруглений допускает — вернули как есть.
export function CategoryFilter<T extends string>({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-8">
      {categories.map((category) => (
        <button
          key={category.value}
          type="button"
          onClick={() => onSelect(category.value)}
          className={`rounded-full px-16 py-8 text-body transition-colors ${
            selected === category.value
              ? "bg-forest text-cream"
              : "bg-beige text-ink hover:bg-terracotta/60"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
