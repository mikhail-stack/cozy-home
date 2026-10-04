"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

// proxy.ts (edge) проверяет только наличие refresh-куки — у него нет роли
// из токена (комментарий там же). Роль живёт в auth.store и известна лишь
// на клиенте, поэтому «user → редирект на главную» при заходе на /admin
// (ТЗ, раздел 6) делается здесь. Реальные данные всё равно защищены на
// бэкенде (requireRole("admin")) — это только UX, а не граница доступа.
export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isDenied = user !== null && user.role !== "admin";

  useEffect(() => {
    if (isDenied) router.replace("/");
  }, [isDenied, router]);

  if (isDenied) return null;
  return <>{children}</>;
}
