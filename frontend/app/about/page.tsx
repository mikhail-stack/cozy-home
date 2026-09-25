import Image from "next/image";

// Контент статический — в ТЗ (раздел 4.4) сказано, что он редактируется
// администратором через админку; появится вместе с About-модулем
// backend (пункт 19 плана). Блок преимуществ по мотивам "Feature Card"
// из docs/DESIGN.md (нумерованный лейбл '01.', заголовок, текст в
// Stone), но с иконками — осознанное отступление от "no card chrome" по
// запросу в чате: иконки добавлены. Заодно 2 из 4 пунктов заменены под
// смысл присланных иконок (handmade/gift_packaging) — "Скандинавский
// дизайн"/"Забота о клиентах" были расплывчатыми и не имели пары.
const ADVANTAGES = [
  {
    icon: "/natural_materials.png",
    title: "Натуральные материалы",
    text: "Лён, керамика, дерево, соевый воск — никакой пластиковой имитации.",
  },
  {
    icon: "/handmade.png",
    title: "Ручная работа",
    text: "Каждая вещь сделана вручную, поэтому у неё есть характер и мелкие отличия.",
  },
  {
    icon: "/fast_delivery.png",
    title: "Быстрая доставка",
    text: "Оперативно передаём заказ в доставку по всей Украине.",
  },
  {
    icon: "/gift_packaging.png",
    title: "Подарочная упаковка",
    text: "Красиво упакуем каждый заказ — можно сразу дарить.",
  },
];

// Реальный баг: присланный "/about.avif" декодировался Chrome в пустой
// белый прямоугольник ЧЕРЕЗ оптимизатор Next (сам файл открывается
// нормально, и JPEG-вариант от Next — тоже; ломался именно AVIF-выход
// sharp для этого конкретного исходника). Пересохранён локально в PNG
// (той же sharp, `sharp(...).png()`) — с чистого PNG-источника Next
// переизображает в avif/webp без проблем.
export default function AboutPage() {
  return (
    <div className="flex flex-col gap-40">
      <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
        <Image src="/about.png" alt="" fill priority className="object-contain" />
      </div>

      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-40 px-24 pb-32">
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
              <Image
                src={advantage.icon}
                alt=""
                width={40}
                height={40}
                className="h-40 w-40 object-contain"
              />
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
    </div>
  );
}
