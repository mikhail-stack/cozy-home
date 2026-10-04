import { HttpError } from "../../lib/errors.js";
import { hasErrorCode } from "../../lib/prisma-errors.js";
import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { notifyNewOrder } from "../telegram/telegram.service.js";
import { MAX_QUANTITY } from "../cart/cart.schemas.js";
import type { CreateOrderInput, ListOrdersQuery, ORDER_STATUSES } from "./orders.schemas.js";

type Db = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
type OrderStatus = (typeof ORDER_STATUSES)[number];

const itemsInclude = {
  include: { product: { select: { id: true, name: true, images: true } } },
  orderBy: { id: "asc" },
} satisfies Prisma.Order$itemsArgs;

// Покупателя видит только админка (ТЗ, раздел 9: «полные данные покупателя»).
const adminInclude = {
  items: itemsInclude,
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.OrderInclude;

const publicInclude = { items: itemsInclude } satisfies Prisma.OrderInclude;

const unavailable = (name: string) => new HttpError(409, `Товара «${name}» нет в наличии`);
const onlyLeft = (name: string, count: number) =>
  new HttpError(409, `Товара «${name}» в наличии только ${count} шт.`);

// Списание остатка одним условным UPDATE: проверка «хватает ли» и уменьшение —
// одна атомарная операция в БД, поэтому два параллельных заказа на последние
// штуки не уйдут в минус (второй увидит count = 0 и получит 409). Строка
// товара заблокирована до конца транзакции — обнуление inStock следом
// безопасно.
async function reserveStock(tx: Db, productId: string, quantity: number) {
  const { count } = await tx.product.updateMany({
    where: { id: productId, inStock: true, stock: { gte: quantity } },
    data: { stock: { decrement: quantity } },
  });
  if (count > 0) {
    // Закончился — снимаем с наличия (правило — products/stock.ts).
    await tx.product.updateMany({
      where: { id: productId, stock: 0 },
      data: { inStock: false },
    });
    return;
  }

  // Не списали — читаем свежее состояние, чтобы назвать причину.
  const fresh = await tx.product.findUnique({ where: { id: productId } });
  if (!fresh) throw new HttpError(409, "Один из товаров больше не продаётся");
  if (!fresh.inStock || fresh.stock === 0) throw unavailable(fresh.name);
  if (typeof fresh.stock === "number") throw onlyLeft(fresh.name, fresh.stock);
  throw new HttpError(409, `Наличие товара «${fresh.name}» изменилось, попробуйте ещё раз`);
}

// Обратное действие для отмены заказа. Товары без учёта остатка не трогаем.
async function releaseStock(tx: Db, productId: string, quantity: number) {
  await tx.product.updateMany({
    where: { id: productId, stock: { not: null } },
    data: { stock: { increment: quantity } },
  });
  await tx.product.updateMany({
    where: { id: productId, stock: { gt: 0 }, inStock: false },
    data: { inStock: true },
  });
}

// Заказ гостя создаётся без userId (ТЗ, раздел 5). Состав приходит из тела
// запроса — гостевая корзина живёт только в localStorage; цены и наличие
// берутся из БД, значениям с клиента не верим.
export async function createOrder(userId: string | undefined, input: CreateOrderInput) {
  const wanted = new Map<string, number>();
  for (const line of input.items) {
    wanted.set(line.productId, (wanted.get(line.productId) ?? 0) + line.quantity);
  }
  if ([...wanted.values()].some((quantity) => quantity > MAX_QUANTITY)) {
    throw new HttpError(400, `Не больше ${MAX_QUANTITY} штук одного товара`);
  }
  // Единый порядок блокировки строк — два заказа с пересекающимися товарами
  // не уходят в взаимную блокировку.
  const productIds = [...wanted.keys()].sort();

  const order = await prisma
    .$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const byId = new Map(products.map((product) => [product.id, product]));

      let totalPrice = 0;
      for (const productId of productIds) {
        const product = byId.get(productId);
        if (!product) throw new HttpError(409, "Один из товаров больше не продаётся");
        const quantity = wanted.get(productId)!;

        if (product.stock === null) {
          if (!product.inStock) throw unavailable(product.name);
        } else {
          await reserveStock(tx, productId, quantity);
        }
        totalPrice += product.price * quantity;
      }

      const order = await tx.order.create({
        data: {
          name: input.name,
          phone: input.phone,
          comment: input.comment,
          totalPrice,
          userId,
          items: {
            create: productIds.map((productId) => ({
              productId,
              quantity: wanted.get(productId)!,
              price: byId.get(productId)!.price,
            })),
          },
        },
        include: publicInclude,
      });

      // Заказ оформлен из корзины аккаунта — серверная корзина очищается
      // (у гостя её нет, ТЗ раздел 5).
      if (userId) await tx.cartItem.deleteMany({ where: { userId } });
      return order;
    })
    .catch((error: unknown) => {
      // Токен живёт 15 минут, а пользователя могли удалить — внешний ключ.
      throw hasErrorCode(error, "P2003")
        ? new HttpError(401, "Сессия истекла, войдите заново")
        : error;
    });

  // После коммита и без await: сбой Telegram заказ не отменяет и ответ не тормозит.
  void notifyNewOrder(order);
  return order;
}

export const listMyOrders = (userId: string) =>
  prisma.order.findMany({
    where: { userId },
    include: publicInclude,
    orderBy: [{ createdAt: "desc" }, { number: "desc" }],
  });

// Даты фильтра — сутки по UTC; `to` включительно.
function createdAtRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  const range: Prisma.DateTimeFilter = {};
  if (from) range.gte = new Date(`${from}T00:00:00.000Z`);
  if (to) range.lt = new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000);
  return range;
}

// Телефоны хранятся как +380XXXXXXXXX, а искать могут «050 123 45 67» или
// «(050) 123» — запрос, похожий на номер, сводим к цифрам без ведущего нуля
// (0501234567 → 501234567 — подстрока канонического вида).
function searchConditions(q: string): Prisma.OrderWhereInput[] {
  const conditions: Prisma.OrderWhereInput[] = [{ name: { contains: q, mode: "insensitive" } }];
  if (/^[+\d\s\-().]+$/.test(q)) {
    const digits = q.replace(/\D/g, "").replace(/^0/, "");
    if (digits) conditions.push({ phone: { contains: digits } });
  }
  return conditions;
}

// Фильтры админки (ТЗ, раздел 9): статус, период, поиск по имени или телефону.
export async function listOrders(query: ListOrdersQuery) {
  const where: Prisma.OrderWhereInput = {
    status: query.status,
    createdAt: createdAtRange(query.from, query.to),
    ...(query.q ? { OR: searchConditions(query.q) } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: adminInclude,
      orderBy: [{ createdAt: "desc" }, { number: "desc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.order.count({ where }),
  ]);
  return { orders, total, page: query.page, limit: query.limit };
}

export async function getOrder(id: string) {
  const order = await prisma.order.findUnique({ where: { id }, include: adminInclude });
  if (!order) throw new HttpError(404, "Заказ не найден");
  return order;
}

// Отмена возвращает остаток на склад; отменённый заказ окончателен (иначе
// пришлось бы списывать повторно, а остатка уже может не хватить), а
// выполненный отменить нельзя — товар уже у покупателя. Остальные переходы
// свободны. Смена статуса условная (`status` из чтения) — параллельные
// правки того же заказа не вернут остаток дважды.
export async function updateStatus(id: string, status: OrderStatus) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new HttpError(404, "Заказ не найден");
    if (order.status === status)
      return tx.order.findUniqueOrThrow({ where: { id }, include: adminInclude });

    if (order.status === "cancelled") throw new HttpError(409, "Отменённый заказ нельзя изменить");
    if (status === "cancelled" && order.status === "done") {
      throw new HttpError(409, "Выполненный заказ нельзя отменить");
    }

    const { count } = await tx.order.updateMany({
      where: { id, status: order.status },
      data: { status },
    });
    if (count === 0) throw new HttpError(409, "Заказ уже изменён, обновите страницу");

    if (status === "cancelled") {
      const lines = [...order.items].sort((a, b) => a.productId.localeCompare(b.productId));
      for (const line of lines) await releaseStock(tx, line.productId, line.quantity);
    }
    return tx.order.findUniqueOrThrow({ where: { id }, include: adminInclude });
  });
}
