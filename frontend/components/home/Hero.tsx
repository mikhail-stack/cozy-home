// Hero без фото — реальной предметной съёмки (docs/DESIGN.md: full-bleed
// product photography) пока нет, заменять её заглушкой-картинкой не стали.
export function Hero() {
  return (
    <section className="flex flex-col items-center justify-center gap-16 bg-chalk px-20 py-143 text-center">
      <h1 className="font-gp text-heading tracking-heading text-soot">Уют начинается с деталей</h1>
      <a
        href="#catalog"
        className="bg-graphite px-16 py-10 font-gp text-body-sm tracking-body-sm text-chalk hover:opacity-90"
      >
        Перейти к товарам
      </a>
    </section>
  );
}
