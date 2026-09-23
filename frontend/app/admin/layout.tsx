import type { ReactNode } from "react";
import Link from "next/link";

const SECTIONS = [
  { href: "/admin/products", label: "📦 Товары" },
  { href: "/admin/orders", label: "📋 Заказы" },
  { href: "/admin/about", label: "ℹ️ О магазине" },
  { href: "/admin/users", label: "👤 Пользователи" },
];

// Доступ только для роли admin (docs/cozy-home-tz.md, раздел 3) —
// реальная проверка появится вместе с middleware.ts (пункт 12 плана) и
// Auth-модулем backend (пункт 15); пока раздел открыт для демонстрации.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[70vh]">
      <aside className="w-[220px] shrink-0 border-r border-soot px-20 py-32">
        <nav className="flex flex-col gap-16">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="font-gp text-body-sm tracking-body-sm text-soot hover:underline"
            >
              {section.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 px-32 py-32">{children}</div>
    </div>
  );
}
