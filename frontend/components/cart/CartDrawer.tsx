"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore, selectCartTotal } from "@/store/cart.store";
import { useUIStore } from "@/store/ui.store";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CheckoutModal } from "@/components/cart/CheckoutModal";
import { Button } from "@/components/ui/Button";

const primaryLinkClasses =
  "bg-graphite px-16 py-10 font-gp text-body-sm tracking-body-sm text-chalk hover:opacity-90";

// Смонтирован в корневом layout, всегда в DOM — видимость управляется
// ui.store (isCartOpen), чтобы работал slide-transition при открытии/закрытии.
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
        className={`fixed inset-0 z-40 bg-soot/40 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden={!isOpen}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-soot bg-limestone transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-soot px-20 py-16">
          <span className="font-gp text-body-sm tracking-body-sm text-soot">Корзина</span>
          <button type="button" onClick={closeCart} aria-label="Закрыть корзину" className="text-soot">
            ✕
          </button>
        </div>

        {isSubmitted ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-16 px-20 text-center">
            <p className="font-gp text-body-sm tracking-body-sm text-soot">
              Заявка принята, мы свяжемся с вами
            </p>
            <Link href="/" onClick={handleContinueShopping} className={primaryLinkClasses}>
              Перейти к товарам
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-16 px-20 text-center">
            <p className="font-gp text-body-sm tracking-body-sm text-soot">Корзина пуста</p>
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

            <div className="border-t border-soot px-20 py-16">
              <div className="mb-16 flex items-center justify-between font-gp text-body-sm tracking-body-sm text-soot">
                <span>Итого</span>
                <span>{total} грн</span>
              </div>
              <Button variant="solid" className="w-full" onClick={() => setCheckoutOpen(true)}>
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
