import { Inter } from "next/font/google";

// Lunar из дизайн-системы недоступен как веб-шрифт (docs/DESIGN.md).
// Inter — один из явно предложенных в файле аналогов (наряду с Söhne,
// Neue Haas Grotesk), поддерживает кириллицу. Веса 400/500/700 — как в
// системе (текст / кнопки и акценты / логотип и нумерованные лейблы).
export const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  variable: "--font-inter",
  display: "swap",
});
