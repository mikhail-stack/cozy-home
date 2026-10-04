import type { ReactNode } from "react";
import Link from "next/link";
import { AdminGuard } from "@/components/admin/AdminGuard";

const SECTIONS = [
  { href: "/admin/products", label: "📦 Товары" },
  { href: "/admin/orders", label: "📋 Заказы" },
  { href: "/admin/about", label: "ℹ️ О магазине" },
  { href: "/admin/users", label: "👤 Пользователи" },
];

// Доступ только для роли admin (docs/cozy-home-tz.md, раздел 3): proxy.ts
// требует только сессию (любую роль), редирект user → "/" — в AdminGuard
// (там же объяснение, почему не в proxy.ts). Bone-поверхность отделяет
// сайдбар от контента без рамки.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-[70vh]">
        <aside className="w-[220px] shrink-0 bg-bone px-24 py-32">
          <nav className="flex flex-col gap-16">
            {SECTIONS.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian hover:underline"
              >
                {section.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1 px-32 py-32">{children}</div>
      </div>
    </AdminGuard>
  );
}
