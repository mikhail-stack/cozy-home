import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import type { Product } from "@/types/product";
import type { ApiProduct } from "@/lib/adapt-product";

function makeProduct(id: string, price: number): Product {
  return { id, name: `Товар ${id}`, category: "decor", price, description: "", inStock: true };
}

function makeApiProduct(id: string, price: number): ApiProduct {
  return {
    id,
    name: `Товар ${id}`,
    description: "",
    price,
    category: "decor",
    images: [],
    inStock: true,
    stock: null,
    createdAt: new Date().toISOString(),
  } satisfies ApiProduct;
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: () => Promise.resolve(body) } as Response;
}

// Гость — локальная корзина (localStorage), ничего на сервер не уходит;
// авторизованный — каждое действие дополнительно синхронизируется с
// /api/cart в фоне (store/cart.store.ts). Логин здесь не настоящий — только
// выставление accessToken в auth.store, как это делает apiFetch при выборе,
// слать ли Authorization и retry на 401.
describe("cart.store — синхронизация с сервером для авторизованных", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    useAuthStore.setState({ user: null, accessToken: null });
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("гость: addItem/removeItem/setQuantity не обращаются к сети", () => {
    const fetchMock = vi.mocked(fetch);
    const product = makeProduct("a", 100);

    useCartStore.getState().addItem(product);
    useCartStore.getState().setQuantity("a", 3);
    useCartStore.getState().removeItem("a");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("авторизованный: addItem шлёт POST /cart/items и подчищает стор ответом сервера", async () => {
    useAuthStore.setState({
      accessToken: "token",
      user: { id: "u1", name: "Тест", email: "t@test.dev", role: "user" },
    });
    const product = makeProduct("a", 100);
    const serverItem = makeApiProduct("a", 100);
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ items: [{ product: serverItem, quantity: 2 }] }));

    useCartStore.getState().addItem(product);

    // Локальное состояние обновляется синхронно, не дожидаясь сети.
    expect(useCartStore.getState().items).toMatchObject([{ product: { id: "a" }, quantity: 1 }]);

    await vi.waitFor(() => {
      expect(useCartStore.getState().items[0].quantity).toBe(2);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/cart/items"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ productId: "a", quantity: 1 }),
      }),
    );
  });

  it("авторизованный: setQuantity(id, 0) шлёт DELETE, а не PATCH", async () => {
    useAuthStore.setState({
      accessToken: "token",
      user: { id: "u1", name: "Тест", email: "t@test.dev", role: "user" },
    });
    useCartStore.setState({ items: [{ product: makeProduct("a", 100), quantity: 1 }] });
    const fetchMock = vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ items: [] }));

    useCartStore.getState().setQuantity("a", 0);

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/cart/items/a"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  it("авторизованный: ошибка сети перечитывает корзину с сервера целиком", async () => {
    useAuthStore.setState({
      accessToken: "token",
      user: { id: "u1", name: "Тест", email: "t@test.dev", role: "user" },
    });
    const serverItem = makeApiProduct("a", 100);
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ message: "Сервер недоступен" }, false, 500))
      .mockResolvedValueOnce(jsonResponse({ items: [{ product: serverItem, quantity: 5 }] }));

    useCartStore.getState().addItem(makeProduct("a", 100));

    await vi.waitFor(() => {
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondCallUrl = fetchMock.mock.calls[1]?.[0];
    expect(secondCallUrl).toMatch(/\/cart$/);
  });
});
