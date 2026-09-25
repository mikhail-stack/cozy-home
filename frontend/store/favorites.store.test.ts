import { beforeEach, describe, expect, it } from "vitest";
import { useFavoritesStore } from "@/store/favorites.store";

beforeEach(() => {
  useFavoritesStore.setState({ productIds: [] });
  localStorage.clear();
});

describe("favorites.store", () => {
  it("toggle добавляет товар, которого ещё нет в избранном", () => {
    useFavoritesStore.getState().toggle("a");
    expect(useFavoritesStore.getState().productIds).toEqual(["a"]);
  });

  it("toggle убирает товар, который уже в избранном", () => {
    useFavoritesStore.getState().toggle("a");
    useFavoritesStore.getState().toggle("a");
    expect(useFavoritesStore.getState().productIds).toEqual([]);
  });

  it("не трогает другие товары при toggle", () => {
    useFavoritesStore.getState().toggle("a");
    useFavoritesStore.getState().toggle("b");
    useFavoritesStore.getState().toggle("a");
    expect(useFavoritesStore.getState().productIds).toEqual(["b"]);
  });
});
