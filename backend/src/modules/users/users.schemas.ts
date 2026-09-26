import { z } from "zod";

// Те же значения, что enum Role в schema.prisma и UserRole на фронтенде.
export const ROLES = ["user", "admin"] as const;

export const updateRoleSchema = z.object({
  role: z.enum(ROLES, { errorMap: () => ({ message: "Недопустимая роль" }) }),
});

// Пустая строка в query (`?q=`) — «фильтр не задан».
const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const listUsersSchema = z.object({
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
      .max(100, "Не больше 100 пользователей на странице")
      .default(50),
  ),
});
export type ListUsersQuery = z.infer<typeof listUsersSchema>;
