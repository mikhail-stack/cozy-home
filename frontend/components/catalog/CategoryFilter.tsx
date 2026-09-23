interface CategoryOption<T extends string> {
  value: T;
  label: string;
}

interface CategoryFilterProps<T extends string> {
  categories: CategoryOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

// Текстовые ссылки вместо скруглённых "таблеток" из ТЗ — в системе
// docs/DESIGN.md радиус запрещён везде, кроме инпутов; активное состояние
// показывается подчёркиванием (см. компонент "Language Toggle" в DESIGN.md).
export function CategoryFilter<T extends string>({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-20 border-b border-soot pb-16">
      {categories.map((category) => (
        <button
          key={category.value}
          type="button"
          onClick={() => onSelect(category.value)}
          className={`font-gp text-body-sm tracking-body-sm text-soot ${
            selected === category.value ? "underline underline-offset-4" : "hover:underline"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
