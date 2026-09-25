// Коды ошибок Prisma: P2002 — нарушение уникальности, P2003 — нарушение
// внешнего ключа, P2025 — запись не найдена. Проверка «по форме», без
// instanceof: класс ошибки зависит от того, через какой слой она прилетела.
export const hasErrorCode = (error: unknown, code: string): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === code;
