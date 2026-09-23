import type { Product } from "@/types/product";

// Временные данные каталога из docs/cozy-home-tz.md (раздел 2).
// Будут заменены запросом к backend API (пункт 23 плана: Products-модуль).
export const PRODUCTS: Product[] = [
  { id: "candles-1", name: "Соевая свеча «Лаванда и ваниль»", category: "candles", price: 320 },
  { id: "candles-2", name: "Аромадиффузор «Скандинавский лес»", category: "candles", price: 580 },
  { id: "candles-3", name: "Набор чайных свечей (12 шт.)", category: "candles", price: 180 },

  { id: "textile-1", name: "Льняной плед «Туман»", category: "textile", price: 1200 },
  { id: "textile-2", name: "Наволочка с вышивкой «Botanica»", category: "textile", price: 450 },
  { id: "textile-3", name: "Вафельное полотенце «Nord»", category: "textile", price: 280 },

  { id: "kitchen-1", name: "Керамическая кружка ручной работы", category: "kitchen", price: 390 },
  { id: "kitchen-2", name: "Набор мисок «Stone» (3 шт.)", category: "kitchen", price: 860 },
  { id: "kitchen-3", name: "Деревянная разделочная доска", category: "kitchen", price: 640 },

  { id: "decor-1", name: "Настенное зеркало в деревянной раме", category: "decor", price: 1800 },
  { id: "decor-2", name: "Кашпо из терракоты (малое)", category: "decor", price: 320 },
  { id: "decor-3", name: "Плакат «Minimal Forest» A3", category: "decor", price: 220 },
];
