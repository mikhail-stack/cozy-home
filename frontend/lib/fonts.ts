import { Inter, Playfair_Display } from "next/font/google";

// Inter — интерфейс и текст (вес 400/500), поддерживает кириллицу.
export const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

// Playfair Display — только заголовки (docs/DESIGN.md), тоже с кириллицей.
export const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"],
  variable: "--font-playfair",
  display: "swap",
});
