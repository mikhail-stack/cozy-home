import { HttpError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { ListUsersQuery, ROLES } from "./users.schemas.js";

type Role = (typeof ROLES)[number];
type Db = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// Колонки таблицы «Пользователи» (ТЗ, раздел 9). Явный select — хеш пароля
// не может утечь, даже если в модель добавят новые поля.
const publicSelect = {
  id: true,
  name: true,
  email: true,
  telegramChatId: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

// Произвольная константа-ключ advisory-блокировки Postgres: смена роли и
// удаление админов идут строго по одному. Без неё два админа, одновременно
// разжалующие друг друга, оба прошли бы проверку «останется ли админ» и
// система осталась бы без администратора.
const ADMIN_GUARD_LOCK = 7301;

async function lockAdminChanges(tx: Db) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ADMIN_GUARD_LOCK})`;
}

async function requireOtherAdmin(tx: Db, message: string) {
  if ((await tx.user.count({ where: { role: "admin" } })) <= 1) {
    throw new HttpError(409, message);
  }
}

export async function listUsers(query: ListUsersQuery) {
  const where: Prisma.UserWhereInput = query.q
    ? {
        OR: [
          { name: { contains: query.q, mode: "insensitive" } },
          { email: { contains: query.q, mode: "insensitive" } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: publicSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);
  return { users, total, page: query.page, limit: query.limit };
}

// Себя менять нельзя (случайно потерять доступ в админку), и в системе
// всегда остаётся хотя бы один админ. Роль в access-токене живёт до 15
// минут, refresh перечитывает её из БД (auth.service.refresh) — смена
// вступает в силу не позже чем через это время.
export async function setRole(actorId: string, targetId: string, role: Role) {
  if (actorId === targetId) throw new HttpError(409, "Нельзя изменить собственную роль");

  return prisma.$transaction(async (tx) => {
    await lockAdminChanges(tx);
    const target = await tx.user.findUnique({ where: { id: targetId }, select: publicSelect });
    if (!target) throw new HttpError(404, "Пользователь не найден");
    if (target.role === role) return target;

    if (target.role === "admin") {
      await requireOtherAdmin(tx, "Нельзя лишить прав последнего администратора");
    }
    return tx.user.update({ where: { id: targetId }, data: { role }, select: publicSelect });
  });
}

// Корзина удаляется каскадом (CartItem.onDelete: Cascade), а заказы остаются —
// это история магазина, — и отвязываются от аккаунта (заказ гостя тоже без
// userId, ТЗ раздел 5; имя и телефон покупателя в самом заказе сохраняются).
export async function removeUser(actorId: string, targetId: string) {
  if (actorId === targetId) throw new HttpError(409, "Нельзя удалить самого себя");

  await prisma.$transaction(async (tx) => {
    await lockAdminChanges(tx);
    const target = await tx.user.findUnique({ where: { id: targetId }, select: { role: true } });
    if (!target) throw new HttpError(404, "Пользователь не найден");

    if (target.role === "admin") {
      await requireOtherAdmin(tx, "Нельзя удалить последнего администратора");
    }
    await tx.order.updateMany({ where: { userId: targetId }, data: { userId: null } });
    await tx.user.delete({ where: { id: targetId } });
  });
}
