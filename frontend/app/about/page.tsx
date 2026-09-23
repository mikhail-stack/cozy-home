// Контент статический — в ТЗ (раздел 4.4) сказано, что он редактируется
// администратором через админку; появится вместе с About-модулем
// backend (пункт 19 плана).
const ADVANTAGES = [
  {
    title: "Натуральные материалы",
    text: "Лён, керамика, дерево, соевый воск — никакой пластиковой имитации.",
    icon: (
      <path d="M12 3c-3 3-6 6-6 10a6 6 0 0 0 12 0c0-4-3-7-6-10Z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Скандинавский дизайн",
    text: "Лаконичные формы и спокойные тона для уютного дома.",
    icon: (
      <>
        <path d="M4 11.5 12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 10v9h12v-9" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "Быстрая доставка",
    text: "Оперативно передаём заказ в доставку по всей Украине.",
    icon: (
      <>
        <rect x="2" y="8" width="12" height="8" strokeLinejoin="round" />
        <path d="M14 11h4l3 3v2h-7z" strokeLinejoin="round" />
        <circle cx="6.5" cy="18" r="1.5" />
        <circle cx="17" cy="18" r="1.5" />
      </>
    ),
  },
  {
    title: "Забота о клиентах",
    text: "На связи в Telegram и по телефону — поможем с выбором и заказом.",
    icon: (
      <path
        d="M12 20s-7-4.4-9.5-8.7C1 8.4 2.4 5 6 5c2 0 3.3 1.1 4 2.2C10.7 6.1 12 5 14 5c3.6 0 5 3.4 3.5 6.3C15 15.6 12 20 12 20Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-40 px-20 py-32">
      <section className="flex flex-col gap-16">
        <h1 className="font-gp text-heading tracking-heading text-soot">Cozy Home</h1>
        <p className="font-gp text-body-sm tracking-body-sm text-soot">
          Cozy Home — интернет-магазин товаров для дома и декора в скандинавском /
          минималистичном стиле. Мы собираем небольшие вещи, из которых складывается уют:
          свечи и ароматы, текстиль, посуда и предметы декора — для тех, кто обустраивает
          своё жильё и ценит детали.
        </p>
      </section>

      <section className="grid gap-24 border-y border-soot py-32 sm:grid-cols-2">
        {ADVANTAGES.map((advantage) => (
          <div key={advantage.title} className="flex gap-12">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="shrink-0 text-soot"
              aria-hidden="true"
            >
              {advantage.icon}
            </svg>
            <div className="flex flex-col gap-4">
              <span className="font-gp text-body-sm tracking-body-sm text-soot">{advantage.title}</span>
              <span className="font-gp text-caption tracking-caption text-soot">{advantage.text}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-8">
        <h2 className="font-gp text-subheading tracking-subheading text-soot">Контакты</h2>
        <a href="tel:+380000000000" className="font-gp text-body-sm tracking-body-sm text-soot hover:underline">
          +380 00 000 00 00
        </a>
        <a
          href="mailto:hello@cozyhome.ua"
          className="font-gp text-body-sm tracking-body-sm text-soot hover:underline"
        >
          hello@cozyhome.ua
        </a>
      </section>
    </div>
  );
}
