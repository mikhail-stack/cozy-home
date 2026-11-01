import { test, expect, type Page } from "@playwright/test";

// Реальный браузер поверх реального dev-сервера — проверяем связку
// карточка товара → cart.store → CartDrawer целиком: добавление,
// изменение количества, удаление и пересчёт суммы на каждом шаге.
// Каждый test получает свежий контекст браузера (свой localStorage),
// поэтому сброс cart.store между тестами не нужен — в отличие от
// component-тестов на Vitest (там стор — общий синглтон процесса).
const CANDLE = { id: "candles-1", price: 320 };
const DIFFUSER = { id: "candles-2", price: 580 };

function productCard(page: Page, id: string) {
  return page.getByTestId(`product-card-${id}`);
}

// У Header десктопный и мобильный набор контролов в DOM одновременно
// (переключение — Tailwind hidden/md:flex), поэтому у кнопки корзины
// всегда 2 совпадения по aria-label — :visible оставляет ту, что видна
// при дефолтном (desktop) вьюпорте Playwright.
function openCart(page: Page) {
  return page.locator('button[aria-label^="Корзина"]:visible').click();
}

test.describe("Корзина", () => {
  test("добавление товара обновляет счётчик в шапке и появляется в виджете с верной ценой", async ({
    page,
  }) => {
    await page.goto("/");

    await productCard(page, CANDLE.id).getByRole("button", { name: "В корзину" }).click();
    await expect(page.locator('button[aria-label^="Корзина"]:visible')).toHaveAttribute(
      "aria-label",
      "Корзина: 1 товаров",
    );

    await openCart(page);
    const row = page.getByTestId(`cart-item-${CANDLE.id}`);
    await expect(row).toBeVisible();
    await expect(row.getByText("1", { exact: true })).toBeVisible();
    await expect(page.getByTestId("cart-total")).toHaveText(`${CANDLE.price} грн`);
  });

  test("изменение количества (+/-) пересчитывает сумму", async ({ page }) => {
    await page.goto("/");
    await productCard(page, CANDLE.id).getByRole("button", { name: "В корзину" }).click();
    await openCart(page);

    const row = page.getByTestId(`cart-item-${CANDLE.id}`);
    const total = page.getByTestId("cart-total");

    await row.getByRole("button", { name: "Увеличить количество" }).click();
    await row.getByRole("button", { name: "Увеличить количество" }).click();
    await expect(row.getByText("3", { exact: true })).toBeVisible();
    await expect(total).toHaveText(`${CANDLE.price * 3} грн`);

    await row.getByRole("button", { name: "Уменьшить количество" }).click();
    await expect(row.getByText("2", { exact: true })).toBeVisible();
    await expect(total).toHaveText(`${CANDLE.price * 2} грн`);
  });

  test("второй товар суммирует итог; удаление пересчитывает сумму и опустошает корзину", async ({
    page,
  }) => {
    await page.goto("/");
    await productCard(page, CANDLE.id).getByRole("button", { name: "В корзину" }).click();
    await productCard(page, DIFFUSER.id).getByRole("button", { name: "В корзину" }).click();
    await openCart(page);

    const total = page.getByTestId("cart-total");
    await expect(total).toHaveText(`${CANDLE.price + DIFFUSER.price} грн`);

    await page
      .getByTestId(`cart-item-${CANDLE.id}`)
      .getByRole("button", { name: "Удалить" })
      .click();
    await expect(page.getByTestId(`cart-item-${CANDLE.id}`)).toHaveCount(0);
    await expect(total).toHaveText(`${DIFFUSER.price} грн`);

    await page
      .getByTestId(`cart-item-${DIFFUSER.id}`)
      .getByRole("button", { name: "Удалить" })
      .click();
    await expect(page.getByText("Корзина пуста")).toBeVisible();
  });
});
