import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryFilter } from "@/components/catalog/CategoryFilter";

const categories = [
  { value: "all", label: "Все" },
  { value: "candles", label: "Свечи" },
] as const;

describe("CategoryFilter", () => {
  it("рендерит все категории", () => {
    render(<CategoryFilter categories={[...categories]} selected="all" onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Все" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Свечи" })).toBeInTheDocument();
  });

  it("вызывает onSelect с value выбранной категории", async () => {
    const onSelect = vi.fn();
    render(<CategoryFilter categories={[...categories]} selected="all" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: "Свечи" }));
    expect(onSelect).toHaveBeenCalledWith("candles");
  });

  it("выделяет активную категорию акцентным цветом", () => {
    render(<CategoryFilter categories={[...categories]} selected="candles" onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Свечи" }).className).toContain("bg-cobalt-ink");
    expect(screen.getByRole("button", { name: "Все" }).className).not.toContain("bg-cobalt-ink");
  });
});
