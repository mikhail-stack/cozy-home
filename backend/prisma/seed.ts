import { prisma } from "../src/lib/prisma.js";

// Стартовый каталог — те же 12 товаров и id, что раньше жили во фронтовом
// lib/mock-products.ts (ТЗ, раздел 2); `specs` оттуда намеренно не
// переносятся — в Product backend такого поля нет (решение из пункта 16,
// см. docs/progress.md). Фото — пути от корня сайта (`/products/*.avif`),
// их раздаёт сам фронтенд из frontend/public; для товаров с одним реальным
// фото — один элемент массива (frontend/lib/adapt-product.ts дублирует его
// на все три слота галереи сам, повторять в данных незачем). Фиксированные
// id (`candles-1` и т.д., а не cuid) нужны e2e/cart.spec.ts — тест заморожен
// и ссылается на них напрямую.
const PRODUCTS = [
  {
    id: "candles-1",
    name: "Соевая свеча «Лаванда и ваниль»",
    category: "candles",
    price: 320,
    description:
      "Ручная работа из соевого воска, аромат лаванды и ванили, время горения — до 40 часов.",
    inStock: true,
    stock: 12,
    images: [
      "/products/soy-wax-main.avif",
      "/products/soy-wax-detail.avif",
      "/products/soy-wax-interior.avif",
    ],
  },
  {
    id: "candles-2",
    name: "Аромадиффузор «Скандинавский лес»",
    category: "candles",
    price: 580,
    description: "Аромадиффузор с деревянными палочками, свежий хвойный аромат для дома.",
    inStock: true,
    stock: 3,
    images: [
      "/products/reed-diffuser-main.avif",
      "/products/reed-diffuser-detail.avif",
      "/products/reed-diffuser-interior.avif",
    ],
  },
  {
    id: "candles-3",
    name: "Набор чайных свечей (12 шт.)",
    category: "candles",
    price: 180,
    description: "12 чайных свечей без запаха — для декора и уютного вечера.",
    inStock: true,
    images: ["/products/white-tealight-candles.avif"],
  },
  {
    id: "textile-1",
    name: "Льняной плед «Туман»",
    category: "textile",
    price: 1200,
    description: "Плед из 100% льна, мягкий и лёгкий — идеален для дивана или кровати.",
    inStock: true,
    images: ["/products/soft-linen-throw.avif"],
  },
  {
    id: "textile-2",
    name: "Наволочка с вышивкой «Botanica»",
    category: "textile",
    price: 450,
    description: "Наволочка из хлопка с ботанической вышивкой ручной работы.",
    inStock: true,
    images: ["/products/linen-cushion-cover.avif"],
  },
  {
    id: "textile-3",
    name: "Вафельное полотенце «Nord»",
    category: "textile",
    price: 280,
    description: "Вафельное полотенце из хлопка — хорошо впитывает влагу и быстро сохнет.",
    inStock: true,
    images: ["/products/cotton-waffle-weave-towel.avif"],
  },
  {
    id: "kitchen-1",
    name: "Керамическая кружка ручной работы",
    category: "kitchen",
    price: 390,
    description: "Кружка ручной работы из керамики — каждая в своём неповторимом виде.",
    inStock: true,
    stock: 25,
    images: ["/products/ceramic-mug.avif"],
  },
  {
    id: "kitchen-2",
    name: "Набор мисок «Stone» (3 шт.)",
    category: "kitchen",
    price: 860,
    description: "Набор из трёх керамических мисок разного размера в спокойных тонах.",
    inStock: true,
    images: ["/products/set-of-three-ceramic-bowls.avif"],
  },
  {
    id: "kitchen-3",
    name: "Деревянная разделочная доска",
    category: "kitchen",
    price: 640,
    description: "Разделочная доска из массива дерева — для кухни и сервировки.",
    inStock: true,
    images: ["/products/oak-cutting-board.avif"],
  },
  {
    id: "decor-1",
    name: "Настенное зеркало в деревянной раме",
    category: "decor",
    price: 1800,
    description: "Настенное зеркало в раме из натурального дерева.",
    inStock: false,
    images: ["/products/round-wall-mirror.avif"],
  },
  {
    id: "decor-2",
    name: "Кашпо из терракоты (малое)",
    category: "decor",
    price: 320,
    description: "Небольшое кашпо из терракоты для комнатных растений.",
    inStock: true,
    images: ["/products/terracotta-pot.avif"],
  },
  {
    id: "decor-3",
    name: "Плакат «Minimal Forest» A3",
    category: "decor",
    price: 220,
    description: "Постер А3 в минималистичном стиле — лес в приглушённых тонах.",
    inStock: true,
    images: ["/products/minimalist-art-print.avif"],
  },
] as const;

async function main() {
  for (const product of PRODUCTS) {
    const { id, ...data } = product;
    await prisma.product.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
  console.log(`Засеяно товаров: ${PRODUCTS.length}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
