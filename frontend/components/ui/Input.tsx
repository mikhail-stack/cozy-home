import type { InputHTMLAttributes } from "react";

// В docs/DESIGN.md нет отдельного компонента для полей ввода (Nornorm —
// сайт-витрина без форм) — оформление экстраполировано из общей системы:
// Ash-поверхность (роль "neutral fill для low-emphasis controls"),
// hairline-рамка, radius как у карточек/ссылок (8px). Фокус — Cobalt Ink:
// единственный случай применения акцента вне лого/CTA — активное состояние.
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-graphite bg-ash px-16 py-12 font-lunar text-body-sm tracking-body-sm text-obsidian placeholder-stone focus:border-cobalt-ink focus:outline-none ${className}`}
      {...props}
    />
  );
}
