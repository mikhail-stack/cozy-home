import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductInfo } from "@/components/product/ProductInfo";
import { useCartStore } from "@/store/cart.store";
import { useFavoritesStore } from "@/store/favorites.store";
import type { Product } from "@/types/product";

const base: Product = {
  id: "candle",
  name: "Свеча",
  category: "candles",
  price: 320,
  description: "Ручная работа",
  inStock: true,
};

beforeEach(() => {
  useCartStore.setState({ items: [] });
  useFavoritesStore.setState({ productIds: [] });
  localStorage.clear();
});

const plus = () => screen.getByRole("button", { name: "Увеличить количество" });

describe("ProductInfo и остаток товара", () => {
  it("показывает «Осталось N шт.», когда осталось мало", () => {
    render(<ProductInfo product={{ ...base, stock: 3 }} />);
    expect(screen.getByText("Осталось 3 шт.")).toBeInTheDocument();
  });

  it("не показывает счётчик остатка, если товара много или учёт выключен", () => {
    render(<ProductInfo product={{ ...base, stock: 40 }} />);
    expect(screen.queryByText(/Осталось/)).not.toBeInTheDocument();
  });

  it("степпер не поднимается выше остатка, «+» блокируется", async () => {
    render(<ProductInfo product={{ ...base, stock: 2 }} />);

    await userEvent.click(plus());
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(plus()).toBeDisabled();
  });

  it("в корзину уходит выбранное количество", async () => {
    render(<ProductInfo product={{ ...base, stock: 5 }} />);

    await userEvent.click(plus());
    await userEvent.click(plus());
    await userEvent.click(screen.getByRole("button", { name: "В корзину" }));

    expect(useCartStore.getState().items).toMatchObject([{ quantity: 3 }]);
  });

  it("если весь остаток уже в корзине — «Максимум в корзине» и всё заблокировано", () => {
    const product = { ...base, stock: 2 };
    useCartStore.setState({ items: [{ product, quantity: 2 }] });

    render(<ProductInfo product={product} />);

    expect(screen.getByRole("button", { name: "Максимум в корзине" })).toBeDisabled();
    expect(plus()).toBeDisabled();
  });

  it("недоступный товар: «Нет в наличии», добавить нельзя", () => {
    render(<ProductInfo product={{ ...base, inStock: false }} />);

    expect(screen.getByText("Нет в наличии")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "В корзину" })).toBeDisabled();
  });
});
