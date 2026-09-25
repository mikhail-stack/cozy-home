import type { Product, ProductImages } from "@/types/product";

// Временные данные каталога из docs/cozy-home-tz.md (раздел 2).
// Будут заменены запросом к backend API (пункт 23 плана: Products-модуль).
// `specs` в ТЗ не описаны (сущность Product там без характеристик) —
// добавлены по запросу в чате для страницы товара, набор полей
// подобран под категорию каждого товара.

// Для 10 из 12 товаров есть только одно реальное фото (не тройка
// main/detail/interior, как у candles-1/candles-2) — по решению из чата
// оно дублируется на все 3 слота галереи ProductGallery.
function singlePhoto(path: string): ProductImages {
  return { main: path, detail: path, interior: path };
}
export const PRODUCTS: Product[] = [
  {
    id: "candles-1",
    name: "Соевая свеча «Лаванда и ваниль»",
    category: "candles",
    price: 320,
    description:
      "Ручная работа из соевого воска, аромат лаванды и ванили, время горения — до 40 часов.",
    inStock: true,
    images: {
      main: "/products/soy-wax-main.avif",
      detail: "/products/soy-wax-detail.avif",
      interior: "/products/soy-wax-interior.avif",
    },
    specs: [
      { label: "Объём", value: "200 мл" },
      { label: "Время горения", value: "до 40 часов" },
      { label: "Материал", value: "соевый воск" },
    ],
  },
  {
    id: "candles-2",
    name: "Аромадиффузор «Скандинавский лес»",
    category: "candles",
    price: 580,
    description: "Аромадиффузор с деревянными палочками, свежий хвойный аромат для дома.",
    inStock: true,
    images: {
      main: "/products/reed-diffuser-main.avif",
      detail: "/products/reed-diffuser-detail.avif",
      interior: "/products/reed-diffuser-interior.avif",
    },
    specs: [
      { label: "Объём", value: "100 мл" },
      { label: "Длина палочек", value: "25 см" },
      { label: "Материал флакона", value: "стекло" },
    ],
  },
  {
    id: "candles-3",
    name: "Набор чайных свечей (12 шт.)",
    category: "candles",
    price: 180,
    description: "12 чайных свечей без запаха — для декора и уютного вечера.",
    inStock: true,
    images: singlePhoto("/products/white-tealight-candles.avif"),
    specs: [
      { label: "Количество в наборе", value: "12 шт." },
      { label: "Время горения одной свечи", value: "до 4 часов" },
      { label: "Диаметр", value: "3.8 см" },
    ],
  },

  {
    id: "textile-1",
    name: "Льняной плед «Туман»",
    category: "textile",
    price: 1200,
    description: "Плед из 100% льна, мягкий и лёгкий — идеален для дивана или кровати.",
    inStock: true,
    images: singlePhoto("/products/soft-linen-throw.avif"),
    specs: [
      { label: "Размер", value: "130 × 170 см" },
      { label: "Материал", value: "100% лён" },
      { label: "Уход", value: "машинная стирка 30°C" },
    ],
  },
  {
    id: "textile-2",
    name: "Наволочка с вышивкой «Botanica»",
    category: "textile",
    price: 450,
    description: "Наволочка из хлопка с ботанической вышивкой ручной работы.",
    inStock: true,
    images: singlePhoto("/products/linen-cushion-cover.avif"),
    specs: [
      { label: "Размер", value: "45 × 45 см" },
      { label: "Материал", value: "100% хлопок" },
      { label: "Уход", value: "ручная стирка" },
    ],
  },
  {
    id: "textile-3",
    name: "Вафельное полотенце «Nord»",
    category: "textile",
    price: 280,
    description: "Вафельное полотенце из хлопка — хорошо впитывает влагу и быстро сохнет.",
    inStock: true,
    images: singlePhoto("/products/cotton-waffle-weave-towel.avif"),
    specs: [
      { label: "Размер", value: "50 × 90 см" },
      { label: "Материал", value: "100% хлопок" },
      { label: "Плотность", value: "240 г/м²" },
    ],
  },

  {
    id: "kitchen-1",
    name: "Керамическая кружка ручной работы",
    category: "kitchen",
    price: 390,
    description: "Кружка ручной работы из керамики — каждая в своём неповторимом виде.",
    inStock: true,
    images: singlePhoto("/products/ceramic-mug.avif"),
    specs: [
      { label: "Объём", value: "350 мл" },
      { label: "Материал", value: "керамика" },
      { label: "Можно в посудомойке", value: "да" },
    ],
  },
  {
    id: "kitchen-2",
    name: "Набор мисок «Stone» (3 шт.)",
    category: "kitchen",
    price: 860,
    description: "Набор из трёх керамических мисок разного размера в спокойных тонах.",
    inStock: true,
    images: singlePhoto("/products/set-of-three-ceramic-bowls.avif"),
    specs: [
      { label: "Количество в наборе", value: "3 шт." },
      { label: "Диаметр", value: "14 / 17 / 20 см" },
      { label: "Материал", value: "керамика" },
    ],
  },
  {
    id: "kitchen-3",
    name: "Деревянная разделочная доска",
    category: "kitchen",
    price: 640,
    description: "Разделочная доска из массива дерева — для кухни и сервировки.",
    inStock: true,
    images: singlePhoto("/products/oak-cutting-board.avif"),
    specs: [
      { label: "Размер", value: "40 × 25 см" },
      { label: "Материал", value: "массив дуба" },
      { label: "Толщина", value: "2 см" },
    ],
  },

  {
    id: "decor-1",
    name: "Настенное зеркало в деревянной раме",
    category: "decor",
    price: 1800,
    description: "Настенное зеркало в раме из натурального дерева.",
    inStock: false,
    images: singlePhoto("/products/round-wall-mirror.avif"),
    specs: [
      { label: "Диаметр", value: "60 см" },
      { label: "Материал рамы", value: "массив дуба" },
      { label: "Форма", value: "круглое" },
    ],
  },
  {
    id: "decor-2",
    name: "Кашпо из терракоты (малое)",
    category: "decor",
    price: 320,
    description: "Небольшое кашпо из терракоты для комнатных растений.",
    inStock: true,
    images: singlePhoto("/products/terracotta-pot.avif"),
    specs: [
      { label: "Диаметр", value: "14 см" },
      { label: "Высота", value: "13 см" },
      { label: "Материал", value: "терракота" },
    ],
  },
  {
    id: "decor-3",
    name: "Плакат «Minimal Forest» A3",
    category: "decor",
    price: 220,
    description: "Постер А3 в минималистичном стиле — лес в приглушённых тонах.",
    inStock: true,
    images: singlePhoto("/products/minimalist-art-print.avif"),
    specs: [
      { label: "Размер", value: "A3 (29.7 × 42 см)" },
      { label: "Материал", value: "плотная матовая бумага" },
      { label: "Рамка в комплекте", value: "нет" },
    ],
  },
];
