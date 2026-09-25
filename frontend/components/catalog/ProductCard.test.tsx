import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "@/components/catalog/ProductCard";
import { useCartStore } from "@/store/cart.store";
import { useFavoritesStore } from "@/store/favorites.store";
import type { Product } from "@/types/product";

const product: Product = {
  id: "candles-1",
  name: "Соевая свеча «Лаванда и ваниль»",
  category: "candles",
  price: 320,
  description: "Ручная работа из соевого воска.",
  inStock: true,
};

const productWithImage: Product = {
  ...product,
  id: "candles-2",
  images: {
    main: "/products/soy-wax-main.avif",
    detail: "/products/soy-wax-detail.avif",
    interior: "/products/soy-wax-interior.avif",
  },
};

// ProductCard читает реальные Zustand-сторы (не через пропсы), поэтому
// это скорее интеграционный тест компонента с cart.store/favorites.store,
// а не изолированный unit — сбрасываем оба стора перед каждым тестом.
beforeEach(() => {
  useCartStore.setState({ items: [] });
  useFavoritesStore.setState({ productIds: [] });
  localStorage.clear();
});

describe("ProductCard", () => {
  it("рендерит название, цену и буквенную заглушку без фото", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText(product.name)).toBeInTheDocument();
    expect(screen.getByText(`${product.price} грн`)).toBeInTheDocument();
    expect(screen.getByText("С")).toBeInTheDocument();
  });

  it("рендерит фото товара вместо заглушки, если оно есть", () => {
    render(<ProductCard product={productWithImage} />);
    expect(screen.getByRole("img", { name: productWithImage.name })).toBeInTheDocument();
  });

  it("клик «В корзину» добавляет товар в cart.store", async () => {
    render(<ProductCard product={product} />);
    await userEvent.click(screen.getByRole("button", { name: "В корзину" }));
    expect(useCartStore.getState().items).toMatchObject([
      { product: { id: product.id }, quantity: 1 },
    ]);
  });

  it("клик по сердечку переключает избранное в favorites.store", async () => {
    render(<ProductCard product={product} />);
    const favoriteButton = screen.getByRole("button", { name: "Добавить в избранное" });

    await userEvent.click(favoriteButton);
    expect(useFavoritesStore.getState().productIds).toContain(product.id);

    await userEvent.click(screen.getByRole("button", { name: "Убрать из избранного" }));
    expect(useFavoritesStore.getState().productIds).not.toContain(product.id);
  });
});
