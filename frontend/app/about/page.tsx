// Контент статический — в ТЗ (раздел 4.4) сказано, что он редактируется
// администратором через админку; появится вместе с About-модулем
// backend (пункт 19 плана). Блок преимуществ оформлен по "Feature Card"
// из docs/DESIGN.md: нумерованный лейбл ('01.'), заголовок, текст в
// Stone — без иконок, рамок и теней ("no card chrome").
const ADVANTAGES = [
  {
    title: "Натуральные материалы",
    text: "Лён, керамика, дерево, соевый воск — никакой пластиковой имитации.",
  },
  {
    title: "Скандинавский дизайн",
    text: "Лаконичные формы и спокойные тона для уютного дома.",
  },
  {
    title: "Быстрая доставка",
    text: "Оперативно передаём заказ в доставку по всей Украине.",
  },
  {
    title: "Забота о клиентах",
    text: "На связи в Telegram и по телефону — поможем с выбором и заказом.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-40 px-24 py-32">
      <section className="flex flex-col gap-16">
        <h1 className="font-lunar text-heading tracking-heading text-obsidian">Cozy Home</h1>
        <p className="font-lunar text-body-sm tracking-body-sm text-stone">
          Cozy Home — интернет-магазин товаров для дома и декора в скандинавском / минималистичном
          стиле. Мы собираем небольшие вещи, из которых складывается уют: свечи и ароматы, текстиль,
          посуда и предметы декора — для тех, кто обустраивает своё жильё и ценит детали.
        </p>
      </section>

      <section className="grid gap-32 sm:grid-cols-2">
        {ADVANTAGES.map((advantage, index) => (
          <div key={advantage.title} className="flex flex-col gap-8">
            <span className="font-lunar text-body-sm tracking-body-sm font-bold text-obsidian">
              {String(index + 1).padStart(2, "0")}.
            </span>
            <span className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian">
              {advantage.title}
            </span>
            <span className="font-lunar text-body-sm tracking-body-sm text-stone">
              {advantage.text}
            </span>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-8">
        <h2 className="font-lunar text-subheading tracking-subheading text-obsidian">Контакты</h2>
        <a
          href="tel:+380000000000"
          className="font-lunar text-body-sm tracking-body-sm text-obsidian hover:underline"
        >
          +380 00 000 00 00
        </a>
        <a
          href="mailto:hello@cozyhome.ua"
          className="font-lunar text-body-sm tracking-body-sm text-obsidian hover:underline"
        >
          hello@cozyhome.ua
        </a>
      </section>
    </div>
  );
}
