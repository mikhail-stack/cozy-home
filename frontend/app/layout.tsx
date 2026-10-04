import type { Metadata } from "next";
import type { ReactNode } from "react";
import { inter } from "@/lib/fonts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SessionBootstrap } from "@/components/auth/SessionBootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cozy Home — Уют начинается с деталей",
  description: "Товары для дома и декора в скандинавском / минималистичном стиле",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      {/* suppressHydrationWarning — браузерные расширения (например,
          ColorZilla) добавляют атрибуты на body до гидратации React,
          что иначе всегда триггерит ложное предупреждение о mismatch. */}
      {/* flex-col + min-h-screen + main flex-1 — футер прижат к низу
          вьюпорта на страницах с малым количеством контента (например,
          пустое "Избранное"), а не "подвисает" сразу под контентом. */}
      <body suppressHydrationWarning className="flex min-h-screen flex-col">
        <SessionBootstrap />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  );
}
