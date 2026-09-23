import type { InputHTMLAttributes } from "react";

// Полная рамка (Terracotta), не hairline-underline, как в прошлой версии
// системы — см. docs/DESIGN.md.
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-sm border border-terracotta bg-surface px-12 py-10 text-body text-ink placeholder-ink/40 focus:border-forest focus:outline-none ${className}`}
      {...props}
    />
  );
}
