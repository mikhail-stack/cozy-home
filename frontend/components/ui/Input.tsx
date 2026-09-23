import type { InputHTMLAttributes } from "react";

// Инпут — единственный элемент системы с ненулевым радиусом (docs/DESIGN.md).
// Без заливки, только нижний hairline-бордер в Soot.
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`font-gp text-body-sm tracking-body-sm text-soot placeholder-soot/60 bg-transparent border-0 border-b border-soot rounded-sm px-0 py-7 focus:outline-none ${className}`}
      {...props}
    />
  );
}
