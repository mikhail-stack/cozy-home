import Image from "next/image";

// Реальный логотип пользователя (frontend/public/logo.png) — сознательное
// отступление от компонента "Logo Wordmark" в docs/DESIGN.md (тот описывает
// двухстрочный текст в Cobalt Ink): цвет и вид логотипа остаются как есть,
// не перекрашиваем под акцент системы.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Image src="/logo.png" alt="Cozy Home" width={218} height={40} priority className={className} />
  );
}
