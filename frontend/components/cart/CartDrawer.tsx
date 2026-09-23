"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore, selectCartTotal } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CheckoutModal } from "@/components/cart/CheckoutModal";
import { Button } from "@/components/ui/Button";

const primaryLinkClasses =
  "rounded-full bg-cobalt-ink px-24 py-12 font-lunar text-body-sm tracking-body-sm font-medium text-canvas-white hover:opacity-90";

// Смонтирован в корневом layout, всегда в DOM — видимость управляется
// ui.store (isCartOpen). Без hairline-рамок внутри — разделы разделены
// поверхностями (Bone для итога), не бордерами (docs/DESIGN.md).
export function CartDrawer() {
  const isOpen = useUIStore((state) => state.isCartOpen);
  const closeCart = useUIStore((state) => state.closeCart);
  const items = useCartStore((state) => state.items);
  const total = useCartStore(selectCartTotal);
  const clearCart = useCartStore((state) => state.clear);

  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [isSubmitted, setSubmitted] = useState(false);

  const handleOrderSubmitted = () => {
    clearCart();
    setCheckoutOpen(false);
    setSubmitted(true);
  };

  const handleContinueShopping = () => {
    setSubmitted(false);
    closeCart();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-obsidian/50 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden={!isOpen}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col bg-canvas-white transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between px-24 py-16">
          <span className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian">Корзина</span>
          <button type="button" onClick={closeCart} aria-label="Закрыть корзину" className="text-obsidian">
            ✕
          </button>
        </div>

        {isSubmitted ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-16 px-24 text-center">
            <p className="font-lunar text-body-sm tracking-body-sm text-obsidian">
              Заявка принята, мы свяжемся с вами
            </p>
            <Link href="/" onClick={handleContinueShopping} className={primaryLinkClasses}>
              Перейти к товарам
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-16 px-24 text-center">
            <p className="font-lunar text-body-sm tracking-body-sm text-obsidian">Корзина пуста</p>
            <Link href="/" onClick={closeCart} className={primaryLinkClasses}>
              Перейти к товарам
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {items.map((item) => (
                <CartItemRow key={item.product.id} item={item} />
              ))}
            </div>

            <div className="bg-bone px-24 py-16">
              <div className="mb-16 flex items-center justify-between font-lunar text-body-sm tracking-body-sm text-obsidian">
                <span>Итого</span>
                <span className="font-medium">{total} грн</span>
              </div>
              <Button variant="primary" className="w-full" onClick={() => setCheckoutOpen(true)}>
                Оформить заказ
              </Button>
            </div>
          </>
        )}
      </aside>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSubmitted={handleOrderSubmitted}
      />
    </>
  );
}
