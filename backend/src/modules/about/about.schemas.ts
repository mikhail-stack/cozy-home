import { z } from "zod";
import { normalizeUaPhone } from "../../lib/phone.js";
import { imageRef } from "../products/products.schemas.js";

const required = (message: string) => ({ required_error: message, invalid_type_error: message });

const text = (label: string, max: number) =>
  z
    .string(required(`Введите ${label}`))
    .trim()
    .min(1, `Введите ${label}`)
    .max(max, `Слишком длинный ${label}`);

const advantage = z.object({
  icon: imageRef,
  title: text("заголовок преимущества", 100),
  text: text("текст преимущества", 500),
});

// Полная замена содержимого страницы — форма админки всегда шлёт все поля.
// В ТЗ (разделы 4.4, 9) преимуществ «3–4»; верхний предел с запасом,
// нижний — хотя бы одно, иначе блок на странице пустой.
export const aboutSchema = z.object({
  title: text("заголовок", 100),
  description: text("основной текст", 3000),
  advantages: z
    .array(advantage, required("Добавьте преимущества"))
    .min(1, "Добавьте хотя бы одно преимущество")
    .max(8, "Не больше 8 преимуществ"),
  // Контактный телефон магазина — тот же единый формат, что и у заказов
  // (только украинские номера, хранится как +380XXXXXXXXX).
  phone: z
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
    }),
  email: z
    .string(required("Введите email"))
    .trim()
    .toLowerCase()
    .min(1, "Введите email")
    .max(254, "Слишком длинный email")
    .email("Введите корректный email"),
});

export type AboutContent = z.infer<typeof aboutSchema>;
