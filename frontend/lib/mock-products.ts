import type { Product } from "@/types/product";

// Временные данные каталога из docs/cozy-home-tz.md (раздел 2).
// Будут заменены запросом к backend API (пункт 23 плана: Products-модуль).
export const PRODUCTS: Product[] = [
  {
    id: "candles-1",
    name: "Соевая свеча «Лаванда и ваниль»",
    category: "candles",
    price: 320,
    description: "Ручная работа из соевого воска, аромат лаванды и ванили, время горения — до 40 часов.",
  },
  {
    id: "candles-2",
    name: "Аромадиффузор «Скандинавский лес»",
    category: "candles",
    price: 580,
    description: "Аромадиффузор с деревянными палочками, свежий хвойный аромат для дома.",
  },
  {
    id: "candles-3",
    name: "Набор чайных свечей (12 шт.)",
    category: "candles",
    price: 180,
    description: "12 чайных свечей без запаха — для декора и уютного вечера.",
  },

  {
    id: "textile-1",
    name: "Льняной плед «Туман»",
    category: "textile",
    price: 1200,
    description: "Плед из 100% льна, мягкий и лёгкий — идеален для дивана или кровати.",
  },
  {
    id: "textile-2",
    name: "Наволочка с вышивкой «Botanica»",
    category: "textile",
    price: 450,
    description: "Наволочка из хлопка с ботанической вышивкой ручной работы.",
  },
  {
    id: "textile-3",
    name: "Вафельное полотенце «Nord»",
    category: "textile",
    price: 280,
    description: "Вафельное полотенце из хлопка — хорошо впитывает влагу и быстро сохнет.",
  },

  {
    id: "kitchen-1",
    name: "Керамическая кружка ручной работы",
    category: "kitchen",
    price: 390,
    description: "Кружка ручной работы из керамики — каждая в своём неповторимом виде.",
  },
  {
    id: "kitchen-2",
    name: "Набор мисок «Stone» (3 шт.)",
    category: "kitchen",
    price: 860,
    description: "Набор из трёх керамических мисок разного размера в спокойных тонах.",
  },
  {
    id: "kitchen-3",
    name: "Деревянная разделочная доска",
    category: "kitchen",
    price: 640,
    description: "Разделочная доска из массива дерева — для кухни и сервировки.",
  },

  {
    id: "decor-1",
    name: "Настенное зеркало в деревянной раме",
    category: "decor",
    price: 1800,
    description: "Настенное зеркало в раме из натурального дерева.",
  },
  {
    id: "decor-2",
    name: "Кашпо из терракоты (малое)",
    category: "decor",
    price: 320,
    description: "Небольшое кашпо из терракоты для комнатных растений.",
  },
  {
    id: "decor-3",
    name: "Плакат «Minimal Forest» A3",
    category: "decor",
    price: 220,
    description: "Постер А3 в минималистичном стиле — лес в приглушённых тонах.",
  },
];
