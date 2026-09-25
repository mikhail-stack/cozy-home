import { z } from "zod";
import { normalizeUaPhone } from "../../lib/phone.js";
import { MAX_QUANTITY } from "../cart/cart.schemas.js";

const required = (message: string) => ({ required_error: message, invalid_type_error: message });

const name = z
  .string(required("Введите имя"))
  .trim()
  .min(1, "Введите имя")
  .max(100, "Имя слишком длинное");

// Формат номера в ТЗ не задан — по решению из чата только украинские номера,
// сохраняются в виде +380XXXXXXXXX (lib/phone.ts).
const phone = z
  .string(required("Введите телефон"))
  .trim()
  .min(1, "Введите телефон")
  .transform((value, ctx) => {
    const normalized = normalizeUaPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Введите корректный номер телефона" });
      return z.NEVER;
    }
    return normalized;
  });

// Пустой комментарий («необязательно») хранится как отсутствие комментария.
const comment = z
  .string(required("Некорректный комментарий"))
  .trim()
  .max(1000, "Комментарий слишком длинный")
  .optional()
  .transform((value) => value || undefined);

export const ORDER_STATUSES = ["new", "processing", "done", "cancelled"] as const;
const status = z.enum(ORDER_STATUSES, {
  errorMap: () => ({ message: "Недопустимый статус заказа" }),
});

export const createOrderSchema = z.object({
  name,
  phone,
  comment,
  items: z
    .array(
      z.object({
        productId: z.string(required("Укажите товар")).min(1, "Укажите товар"),
        quantity: z
          .number(required("Укажите количество"))
          .int("Количество должно быть целым числом")
          .min(1, "Количество должно быть не меньше 1")
          .max(MAX_QUANTITY, `Не больше ${MAX_QUANTITY} штук одного товара`),
      }),
      required("Корзина пуста"),
    )
    .min(1, "Корзина пуста")
    .max(100, "Слишком много позиций"),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateStatusSchema = z.object({ status });

// Пустая строка в query (`?status=`) — «фильтр не задан», как у формы админки.
const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

const isRealDate = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};
const day = z.preprocess(
  blankToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Дата должна быть в формате ГГГГ-ММ-ДД")
    .refine(isRealDate, "Некорректная дата")
    .optional(),
);

export const listOrdersSchema = z.object({
  status: z.preprocess(blankToUndefined, status.optional()),
  from: day,
  to: day,
  q: z.preprocess(
    blankToUndefined,
    z.string().trim().max(100, "Слишком длинный запрос").optional(),
  ),
  page: z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ invalid_type_error: "Некорректная страница" })
      .int("Некорректная страница")
      .min(1, "Некорректная страница")
      .default(1),
  ),
  limit: z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ invalid_type_error: "Некорректный размер страницы" })
      .int("Некорректный размер страницы")
      .min(1, "Некорректный размер страницы")
      .max(100, "Не больше 100 заказов на странице")
      .default(50),
  ),
});
export type ListOrdersQuery = z.infer<typeof listOrdersSchema>;
