import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/Header";
import { useCartStore } from "@/store/cart.store";
import { useFavoritesStore } from "@/store/favorites.store";
import { useAuthStore } from "@/store/auth.store";
import type { Product } from "@/types/product";

function makeProduct(id: string): Product {
  return { id, name: `Товар ${id}`, category: "decor", price: 100, description: "", inStock: true };
}

// Интеграционный тест: Header ничего не получает через пропсы, весь его
// вывод (счётчики корзины/избранного, ссылка "Личный кабинет" вместо
// "Войти") — это подписка на реальные Zustand-сторы. Проверяем связку
// стор → компонент, а не сами сторы в изоляции (для этого есть
// cart.store.test.ts/favorites.store.test.ts).
// Header рендерит десктопный и мобильный набор контролов одновременно
// (переключение — через Tailwind hidden/md:flex, которого нет в jsdom
// без загруженного globals.css), поэтому у корзины/избранного всегда
// по 2 совпадения с одинаковым aria-label — getAllByLabelText, не get.
beforeEach(() => {
  useCartStore.setState({ items: [] });
  useFavoritesStore.setState({ productIds: [] });
  useAuthStore.setState({ user: null, accessToken: null });
  localStorage.clear();
});

describe("Header", () => {
  it("показывает 0 в корзине и избранном без товаров", () => {
    render(<Header />);
    expect(screen.getAllByLabelText("Корзина: 0 товаров")).toHaveLength(2);
    expect(screen.getAllByLabelText("Избранное: 0 товаров")).toHaveLength(2);
  });

  it("обновляет счётчик корзины при добавлении товара в cart.store", () => {
    render(<Header />);
    act(() => {
      useCartStore.getState().addItem(makeProduct("a"), 3);
    });
    expect(screen.getAllByLabelText("Корзина: 3 товаров")).toHaveLength(2);
  });

  it("обновляет счётчик избранного при изменении favorites.store", () => {
    render(<Header />);
    act(() => {
      useFavoritesStore.getState().toggle("a");
      useFavoritesStore.getState().toggle("b");
    });
    expect(screen.getAllByLabelText("Избранное: 2 товаров")).toHaveLength(2);
  });

  it("показывает имя пользователя вместо «Войти» после setSession", () => {
    render(<Header />);
    expect(screen.getByText("Войти")).toBeInTheDocument();

    act(() => {
      useAuthStore
        .getState()
        .setSession({ id: "1", name: "Анна Коваленко", email: "a@a.com", role: "user" }, "token");
    });

    expect(screen.queryByText("Войти")).not.toBeInTheDocument();
    expect(screen.getByText("Анна Коваленко")).toBeInTheDocument();
  });
});
