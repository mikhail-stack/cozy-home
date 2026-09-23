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

// "The nav sits on white with no background treatment" (docs/DESIGN.md,
// Nav Link) — Canvas White, без hairline-рамки снизу: система разделяет
// секции поверхностями (Bone/Canvas), а не бордерами.
export function Header() {
  const cartCount = useCartStore(selectCartCount);
  const openCart = useUIStore((state) => state.openCart);
  const user = useAuthStore((state) => state.user);

  return (
    <header className="bg-canvas-white">
      <div className="flex items-center justify-between gap-24 px-24 py-16">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-24 py-8 font-lunar text-body-sm tracking-body-sm font-medium text-obsidian hover:bg-ash"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-16">
          {user ? (
            <Link
              href="/profile"
              className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian hover:underline"
            >
              {user.name}
            </Link>
          ) : (
            <div className="flex items-center gap-16">
              <Link
                href="/login"
                className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian hover:underline"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian hover:underline"
              >
                Регистрация
              </Link>
            </div>
          )}

          {/* Открывает drawer корзины (ui.store) */}
          <button
            type="button"
            onClick={openCart}
            className="flex items-center gap-8 font-lunar text-body-sm tracking-body-sm font-medium text-obsidian"
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
