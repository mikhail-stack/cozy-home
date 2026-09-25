import { z } from "zod";

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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
