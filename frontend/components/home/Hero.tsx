import Image from "next/image";

// "Hero Overlay" (docs/DESIGN.md) — full-bleed фото с белым текстом
// поверх и парой кнопок Primary+Ghost по центру снизу. DESIGN.md
// полагается на тёмные тона самого фото для контраста текста; наше
// фото светлее, поэтому добавлен лёгкий тёмный градиент поверх —
// осознанное отступление ради читаемости белого текста.
export function Hero() {
  return (
    <section className="relative flex flex-col items-center gap-24 overflow-hidden px-24 py-64 text-center sm:py-140">
      <Image
        src="/hero-banner.avif"
        alt=""
        fill
        priority
        className="object-cover object-[80%]"
      />
      <div className="absolute inset-0 bg-amber-800/20" />

      <h1 className="relative max-w-[800px] text-left font-lunar text-heading leading-[1.2] tracking-heading text-canvas-white sm:text-heading-lg sm:tracking-heading-lg">
        Уют начинается с деталей
      </h1>
      <p className="relative text-left font-lunar text-body leading-[1.2] tracking-body text-canvas-white">
        Товары для дома и декора в скандинавском стиле
      </p>
      <div className="relative flex w-full max-w-[320px] flex-col items-center gap-16 sm:w-auto sm:max-w-none sm:flex-row">
        <a
          href="#catalog"
          className="w-full rounded-md bg-cobalt-ink px-24 py-12 font-lunar text-body-sm tracking-body-sm font-medium text-canvas-white hover:opacity-90 sm:w-auto"
        >
          Перейти к товарам
        </a>
        <a
          href="/about"
          className="w-full rounded-md border border-canvas-white px-24 py-12 font-lunar text-body-sm tracking-body-sm font-medium text-canvas-white hover:bg-canvas-white/10 sm:w-auto"
        >
          О магазине
        </a>
      </div>
    </section>
  );
}
