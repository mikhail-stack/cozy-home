import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "link" | "solid";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

// Текстовая ссылка — основной паттерн взаимодействия в системе (docs/DESIGN.md).
// variant="solid" (Graphite-заливка) — редкое исключение, максимум одна на страницу.
const variantClasses: Record<ButtonVariant, string> = {
  link: "bg-transparent text-soot underline-offset-4 hover:underline",
  solid: "bg-graphite text-chalk px-16 py-10 hover:opacity-90",
};

export function Button({ variant = "link", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`font-gp text-body-sm tracking-body-sm rounded-none transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
