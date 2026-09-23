// Hero без фото — реальной предметной съёмки (docs/DESIGN.md, раздел
// «Фото») пока нет, справа — скруглённый плейсхолдер вместо неё.
export function Hero() {
  return (
    <section className="grid items-center gap-40 px-24 py-64 md:grid-cols-2 md:px-40">
      <div className="flex flex-col items-start gap-16">
        <h1 className="font-heading text-display leading-display text-ink">
          Уют начинается с деталей
        </h1>
        <p className="text-body-lg text-ink/70">
          Товары для дома и декора в скандинавском стиле
        </p>
        <a
          href="#catalog"
          className="rounded-md bg-forest px-16 py-10 text-body font-medium text-cream shadow-sm hover:opacity-90"
        >
          Перейти к товарам
        </a>
      </div>

      <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-terracotta shadow-md">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} className="text-forest" aria-hidden="true">
          <path d="M9 10c0-2 1.5-3 1.5-5S9 2 9 2" strokeLinecap="round" />
          <rect x="7" y="10" width="10" height="10" rx="1.5" />
          <path d="M7 14h10" />
        </svg>
      </div>
    </section>
  );
}
