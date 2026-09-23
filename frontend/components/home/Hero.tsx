// "Hero Overlay" (docs/DESIGN.md) — full-bleed фото с белым текстом
// поверх и парой кнопок Primary+Ghost по центру снизу. Реальной
// интерьерной съёмки нет, поэтому вместо фото — Bone-поверхность и
// тёмный текст; композиция и пара кнопок сохранены.
export function Hero() {
  return (
    <section className="flex flex-col items-center gap-24 bg-bone px-24 py-140 text-center">
      <h1 className="max-w-[800px] font-lunar text-heading-lg tracking-heading-lg text-obsidian">
        Уют начинается с деталей
      </h1>
      <p className="font-lunar text-body tracking-body text-stone">
        Товары для дома и декора в скандинавском стиле
      </p>
      <div className="flex items-center gap-16">
        <a
          href="#catalog"
          className="rounded-full bg-cobalt-ink px-24 py-12 font-lunar text-body-sm tracking-body-sm font-medium text-canvas-white hover:opacity-90"
        >
          Перейти к товарам
        </a>
        <a
          href="/about"
          className="rounded-full border border-obsidian px-24 py-12 font-lunar text-body-sm tracking-body-sm font-medium text-obsidian hover:bg-ash"
        >
          О магазине
        </a>
      </div>
    </section>
  );
}
