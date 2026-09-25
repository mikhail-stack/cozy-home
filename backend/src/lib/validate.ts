import type { z } from "zod";
import { HttpError } from "./errors.js";

// Первая ошибка валидации → 400 с текстом из схемы (тексты — из ТЗ,
// раздел 6, поэтому отдаём их как есть).
export function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message ?? "Некорректный запрос");
  }
  return result.data as z.infer<T>;
}
