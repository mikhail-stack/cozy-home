"use client";

import Link from "next/link";
import { useCartStore, selectCartCount } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/about", label: "О магазине" },
];

export function Header() {
  const cartCount = useCartStore(selectCartCount);
  const openCart = useUIStore((state) => state.openCart);

  return (
    <header className="border-b border-soot bg-limestone">
      <div className="flex items-center justify-between gap-20 px-20 py-16">
        <Link href="/" className="font-gp text-subheading tracking-subheading text-soot">
          Cozy Home
        </Link>

        <nav className="flex items-center gap-20">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-gp text-body-sm tracking-body-sm text-soot hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Открывает drawer корзины (ui.store) — сам drawer появится в пункте 5 плана */}
        <button
          type="button"
          onClick={openCart}
          className="flex items-center gap-6 font-gp text-body-sm tracking-body-sm text-soot"
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
          <span>{cartCount}</span>
        </button>
      </div>
    </header>
  );
}
