import { Inter } from "next/font/google";

// GP из дизайн-системы недоступен как веб-шрифт (docs/DESIGN.md).
// Inter выбран как замена: поддерживает кириллицу и вес 400,
// который единственный используется во всей системе.
export const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  variable: "--font-inter",
  display: "swap",
});
