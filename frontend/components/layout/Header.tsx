"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore, selectCartCount } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { useFavoritesStore } from "@/store/favorites.store";
import { Logo } from "@/components/layout/Logo";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/about", label: "О магазине" },
];

const navLinkClasses =
  "rounded-lg px-16 py-8 font-lunar text-body-sm tracking-body-sm font-medium text-obsidian hover:bg-ash";
const textLinkClasses =
  "font-lunar text-body-sm tracking-body-sm font-medium text-obsidian hover:underline";

// "The nav sits on white with no background treatment" (docs/DESIGN.md,
// Nav Link) — Canvas White, без hairline-рамки снизу: система разделяет
// секции поверхностями (Bone/Canvas), а не бордерами.
// На узких экранах нав/вход/регистрация уходят в гамбургер-меню — в
// один ряд с лого и корзиной они физически не помещаются.
export function Header() {
  const cartCount = useCartStore(selectCartCount);
  const favoritesCount = useFavoritesStore((state) => state.productIds.length);
  const openCart = useUIStore((state) => state.openCart);
  const user = useAuthStore((state) => state.user);
  const [isMenuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="bg-canvas-white">
      <div className="flex items-center justify-between gap-16 px-16 py-12 sm:px-24 sm:py-16">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClasses}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-16 md:flex">
          {user ? (
            <Link href="/profile" className={textLinkClasses}>
              {user.name}
            </Link>
          ) : (
            <div className="flex items-center gap-16">
              <Link href="/login" className={textLinkClasses}>
                Войти
              </Link>
              <Link href="/register" className={textLinkClasses}>
                Регистрация
              </Link>
            </div>
          )}

          <Link
            href="/favorites"
            className="flex items-center gap-8 font-lunar text-body-sm tracking-body-sm font-medium text-obsidian"
            aria-label={`Избранное: ${favoritesCount} товаров`}
          >
            <FavoritesNavIcon />
            <span>{favoritesCount}</span>
          </Link>

          {/* Открывает drawer корзины (ui.store) */}
          <button
            type="button"
            onClick={openCart}
            className="flex items-center gap-8 font-lunar text-body-sm tracking-body-sm font-medium text-obsidian"
            aria-label={`Корзина: ${cartCount} товаров`}
          >
            <CartIcon />
            <span>{cartCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-8 md:hidden">
          <Link
            href="/favorites"
            className="flex items-center gap-4 font-lunar text-body-sm tracking-body-sm font-medium text-obsidian"
            aria-label={`Избранное: ${favoritesCount} товаров`}
          >
            <FavoritesNavIcon />
            <span>{favoritesCount}</span>
          </Link>

          <button
            type="button"
            onClick={openCart}
            className="flex items-center gap-4 font-lunar text-body-sm tracking-body-sm font-medium text-obsidian"
            aria-label={`Корзина: ${cartCount} товаров`}
          >
            <CartIcon />
            <span>{cartCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={isMenuOpen}
            className="text-obsidian"
          >
            {isMenuOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="flex flex-col gap-8 border-t border-ash px-16 py-16 md:hidden">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={closeMenu} className={navLinkClasses}>
              {link.label}
            </Link>
          ))}

          {user ? (
            <Link href="/profile" onClick={closeMenu} className={`${navLinkClasses} block`}>
              {user.name}
            </Link>
          ) : (
            <>
              <Link href="/login" onClick={closeMenu} className={navLinkClasses}>
                Войти
              </Link>
              <Link href="/register" onClick={closeMenu} className={navLinkClasses}>
                Регистрация
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

function FavoritesNavIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        d="M12 20s-7-4.35-9.5-8.5C.8 8.1 2.2 4.5 5.6 4c2-.3 3.7.7 6.4 3 2.7-2.3 4.4-3.3 6.4-3 3.4.5 4.8 4.1 3.1 7.5C19 15.65 12 20 12 20Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path d="M11,19L6.4,4.5C6.2,3.6,5.3,3,4.4,3H2" strokeLinejoin="round" />
      <path d="M26,23H8.4c-1.1,0-2-0.9-2-2v0c0-1.1,0.9-1.8,2-2L29,16V6H11" strokeLinejoin="round" />
      <circle cx="11" cy="28" r="1" />
      <circle cx="24" cy="28" r="1" />
    </svg>
  );
}
