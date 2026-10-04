import { z } from "zod";
import { normalizeUaPhone } from "../../lib/phone.js";

// Тексты ошибок — дословно из docs/cozy-home-tz.md, раздел 6. Порядок
// проверок как на фронтенде (lib/validate-password.ts): сначала длина
// пароля, потом совпадение.
const required = (message: string) => ({ required_error: message, invalid_type_error: message });

export const registerSchema = z
  .object({
    name: z.string(required("Введите имя")).trim().min(1, "Введите имя"),
    email: z.string(required("Введите email")).trim().toLowerCase().email("Некорректный email"),
    password: z
      .string(required("Введите пароль"))
      .min(8, "Пароль должен содержать минимум 8 символов"),
    confirmPassword: z.string(required("Подтвердите пароль")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string(required("Введите email")).trim().toLowerCase(),
  password: z.string(required("Введите пароль")).min(1, "Введите пароль"),
  rememberMe: z.boolean().default(false),
});

const email = z.string(required("Введите email")).trim().toLowerCase().email("Некорректный email");

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    email,
    code: z
      .string(required("Введите код"))
      .trim()
      .regex(/^\d{6}$/, "Неверный код"),
    password: z
      .string(required("Введите пароль"))
      .min(8, "Пароль должен содержать минимум 8 символов"),
    confirmPassword: z.string(required("Подтвердите пароль")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

// undefined — поле не прислали, не трогаем сохранённое значение; null или
// пустая строка — явно снять телефон; непустая строка — привести к
// +380XXXXXXXXX (тот же единый украинский формат, что у заказов и «О
// магазине», lib/phone.ts) или отказать. Не unique в отличие от email —
// занятость не проверяем.
const phone = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value, ctx) => {
    if (value === undefined) return undefined;
    const trimmed = value?.trim();
    if (!trimmed) return null;
    const normalized = normalizeUaPhone(trimmed);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Введите корректный номер телефона" });
      return z.NEVER;
    }
    return normalized;
  });

// Полная замена не нужна — профиль правят по месту (имя/телефон отдельно
// от смены email, а пароль — отдельным эндпоинтом ниже), поэтому все поля
// необязательны, но хотя бы одно обязано быть передано.
export const updateProfileSchema = z
  .object({
    name: z.string(required("Введите имя")).trim().min(1, "Введите имя").optional(),
    email: email.optional(),
    phone,
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Нет полей для обновления",
  });

// Отдельно от updateProfileSchema: смена пароля требует текущий пароль
// (нельзя переписать пароль, просто зная, что сессия ещё активна — иначе
// открытая вкладка на чужом компьютере отдавала бы аккаунт целиком).
export const changePasswordSchema = z
  .object({
    currentPassword: z.string(required("Введите текущий пароль")).min(1, "Введите текущий пароль"),
    newPassword: z
      .string(required("Введите пароль"))
      .min(8, "Пароль должен содержать минимум 8 символов"),
    confirmNewPassword: z.string(required("Подтвердите пароль")),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Пароли не совпадают",
    path: ["confirmNewPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
