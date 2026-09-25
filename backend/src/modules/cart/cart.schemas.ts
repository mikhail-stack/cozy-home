import { z } from "zod";

// Потолок на одну строку корзины — защита от абсурдных значений (в ТЗ
// лимита нет). Во фронтенде степпер пока не ограничен — при интеграции
// (пункт 23) стоит выровнять.
export const MAX_QUANTITY = 99;

const required = (message: string) => ({ required_error: message, invalid_type_error: message });

const quantity = z
  .number(required("Укажите количество"))
  .int("Количество должно быть целым числом")
  .min(1, "Количество должно быть не меньше 1")
  .max(MAX_QUANTITY, `Не больше ${MAX_QUANTITY} штук одного товара`);

const productId = z.string(required("Укажите товар")).min(1, "Укажите товар");

export const addItemSchema = z.object({
  productId,
  quantity: quantity.default(1),
});

// 0 — способ убрать строку (как setQuantity(id, 0) в frontend/store/cart.store.ts).
export const setQuantitySchema = z.object({
  quantity: z
    .number(required("Укажите количество"))
    .int("Количество должно быть целым числом")
    .min(0, "Количество не может быть отрицательным")
    .max(MAX_QUANTITY, `Не больше ${MAX_QUANTITY} штук одного товара`),
});

// Слияние гостевой корзины при входе: данные из localStorage, поэтому
// верхний предел количества здесь НЕ отвергаем, а обрезаем в сервисе —
// иначе устаревшая/большая гостевая корзина ломала бы сам вход.
export const mergeSchema = z.object({
  items: z
    .array(
      z.object({
        productId,
        quantity: z
          .number(required("Укажите количество"))
          .int("Количество должно быть целым числом")
          .positive("Количество должно быть не меньше 1"),
      }),
    )
    .max(100, "Слишком много позиций"),
});

export type MergeLine = z.infer<typeof mergeSchema>["items"][number];
