import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

// Primary — заливка Forest, единственный по-настоящему "активный" цвет
// на экране. Outline — второстепенные действия (docs/DESIGN.md).
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-forest text-cream shadow-sm hover:opacity-90",
  outline: "border border-forest text-forest hover:bg-beige",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md px-16 py-10 text-body font-medium transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
