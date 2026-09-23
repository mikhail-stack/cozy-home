"use client";

import Link from "next/link";
import { useCartStore, selectCartCount } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { Logo } from "@/components/layout/Logo";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/about", label: "О магазине" },
];

export function Header() {
  const cartCount = useCartStore(selectCartCount);
  const openCart = useUIStore((state) => state.openCart);
  const user = useAuthStore((state) => state.user);

  return (
    <header className="border-b border-soot bg-limestone">
      <div className="flex items-center justify-between gap-20 px-20 py-16">
        <Link href="/" className="text-soot">
          <Logo />
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

        <div className="flex items-center gap-20">
          {user ? (
            <Link href="/profile" className="font-gp text-body-sm tracking-body-sm text-soot hover:underline">
              {user.name}
            </Link>
          ) : (
            <div className="flex items-center gap-16">
              <Link href="/login" className="font-gp text-body-sm tracking-body-sm text-soot hover:underline">
                Войти
              </Link>
              <Link href="/register" className="font-gp text-body-sm tracking-body-sm text-soot hover:underline">
                Регистрация
              </Link>
            </div>
          )}

          {/* Открывает drawer корзины (ui.store) */}
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
      </div>
    </header>
  );
}
