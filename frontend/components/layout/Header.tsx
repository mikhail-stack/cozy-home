"use client";

import Link from "next/link";
import { useCartStore, selectCartCount } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { Logo } from "@/components/layout/Logo";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/about", label: "О магазине" },
];

export function Header() {
  const cartCount = useCartStore(selectCartCount);
  const openCart = useUIStore((state) => state.openCart);

  return (
    <header className="border-b border-beige bg-cream">
      <div className="flex items-center justify-between gap-20 px-24 py-16">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="flex items-center gap-24">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-body text-ink hover:text-forest"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Открывает drawer корзины (ui.store) — сам drawer появится в пункте 5 плана */}
        <button
          type="button"
          onClick={openCart}
          className="flex items-center gap-6 rounded-full bg-beige px-12 py-8 text-body text-ink hover:bg-terracotta/60"
          aria-label={`Корзина: ${cartCount} товаров`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path d="M6 8h12l-1 12H7L6 8Z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
          <span className="font-medium text-forest">{cartCount}</span>
        </button>
      </div>
    </header>
  );
}
