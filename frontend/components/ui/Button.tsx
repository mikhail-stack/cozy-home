import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

// Primary CTA — единственная заливка цветом во всей системе (Cobalt Ink).
// Ghost Button — второй элемент "двухкнопочного" паттерна, всегда рядом
// с Primary CTA (docs/DESIGN.md, компоненты Primary CTA Button / Ghost
// Button). Оба — pill (radius 9999px), другой формы для кнопок в системе
// не предусмотрено.
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-cobalt-ink text-canvas-white hover:opacity-90",
  ghost: "bg-transparent text-obsidian border border-obsidian hover:bg-ash",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-full px-24 py-12 font-lunar text-body-sm tracking-body-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
