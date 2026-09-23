import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/profile", "/admin"];
const REFRESH_TOKEN_COOKIE = "refresh_token";

// Next.js 16 переименовал middleware.ts в proxy.ts (`middleware` как
// конвенция deprecated) — см. https://nextjs.org/docs/app/api-reference/file-conventions/proxy
//
// Защищает /profile и /admin: без refresh-cookie — редирект на /login
// (docs/cozy-home-tz.md, раздел 6). Сам cookie выставит backend при
// логине (Auth-модуль, пункт 15 плана) — до этого момента обе страницы
// закономерно недоступны напрямую, это правильное поведение, а не баг.
//
// Разделение "user → редирект на /" при заходе на /admin (раздел 6 ТЗ)
// требует знать роль из токена — добавится, когда появится верификация
// JWT (тоже пункт 15).
export function proxy(request: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(REFRESH_TOKEN_COOKIE);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/admin/:path*"],
};
