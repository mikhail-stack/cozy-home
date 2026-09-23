"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

// Без теней ("No shadows... the system is deliberately flat",
// docs/DESIGN.md) — глубина через затемнённый Obsidian-оверлей. Карточка
// без рамки (Don't: "Do not add borders to ... image containers") на
// Canvas White, radius-lg (8px).
export function Modal({ isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/50"
      onClick={onClose}
    >
      <div
        className="mx-16 w-full max-w-[480px] rounded-lg bg-canvas-white p-24"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
