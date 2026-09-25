interface CategoryOption<T extends string> {
  value: T;
  label: string;
}

interface CategoryFilterProps<T extends string> {
  categories: CategoryOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

// Радиус синхронизирован с Button.tsx (rounded-md) — отступление от
// pill-формы, заданной в docs/DESIGN.md.
// Активная категория — Cobalt Ink: "active state" входит в список из
// трёх разрешённых применений акцента.
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
          className={`rounded-md px-24 py-8 font-lunar text-body-sm tracking-body-sm font-medium transition-colors ${
            selected === category.value
              ? "bg-cobalt-ink text-canvas-white"
              : "bg-ash text-obsidian hover:bg-obsidian/10"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
