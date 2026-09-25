import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("рендерит переданный текст", () => {
    render(<Button>В корзину</Button>);
    expect(screen.getByRole("button", { name: "В корзину" })).toBeInTheDocument();
  });

  it("вызывает onClick при клике", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Отправить</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Отправить" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("не вызывает onClick, если кнопка disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Нет в наличии
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Нет в наличии" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("ghost-вариант не содержит заливку primary (bg-cobalt-ink)", () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button", { name: "Ghost" }).className).not.toContain("bg-cobalt-ink");
  });
});
