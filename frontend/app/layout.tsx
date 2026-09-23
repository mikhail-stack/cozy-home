import type { Metadata } from "next";
import type { ReactNode } from "react";
import { inter, playfair } from "@/lib/fonts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cozy Home — Уют начинается с деталей",
  description: "Товары для дома и декора в скандинавском / минималистичном стиле",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
