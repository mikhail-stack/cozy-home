import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import type { ComponentProps } from "react";

// Без test.globals в vitest.config.ts автодетект афтерхука у
// Testing Library не срабатывает — без явного cleanup DOM одного теста
// оставался бы смонтированным при рендере следующего в том же файле.
afterEach(() => {
  cleanup();
});

// next/image и next/link требуют либо реального Next-раннера, либо
// (у Link) IntersectionObserver для prefetch — в jsdom его нет.
// Подменяем на обычные <img>/<a>: для unit/component-тестов важна
// разметка и клики, а не оптимизация картинок или префетч.
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: ComponentProps<"img"> & Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} />
  ),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: (props: ComponentProps<"a">) => <a {...props} />,
}));
