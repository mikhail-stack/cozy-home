import { HttpError } from "../../lib/errors.js";
import { hasErrorCode } from "../../lib/prisma-errors.js";
import { prisma } from "../../lib/prisma.js";
import { availableQuantity } from "../products/stock.js";
import { MAX_QUANTITY, type MergeLine } from "./cart.schemas.js";

type Db = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// Форма ответа — как у CartItem во фронтенде (frontend/store/cart.store.ts),
// чтобы результат можно было сразу отдать в replaceItems().
async function readCart(db: Db, userId: string) {
  const rows = await db.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { id: "asc" },
  });
  return { items: rows.map((row) => ({ product: row.product, quantity: row.quantity })) };
}

// Токен живёт 15 минут, а пользователя могли удалить — тогда вставка
// строки корзины падает на внешнем ключе. Отвечаем как на просроченную
// сессию, а не 500.
async function inTransaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
  try {
    return await prisma.$transaction(fn);
  } catch (error) {
    throw hasErrorCode(error, "P2003")
      ? new HttpError(401, "Сессия истекла, войдите заново")
      : error;
  }
}

const onlyLeft = (count: number) => new HttpError(409, `В наличии только ${count} шт.`);

// Прибавляет к существующей строке (или создаёт). `limit` — сколько всего
// штук допустимо в строке по остатку (Infinity — остаток не учитывается).
// strict: при превышении отказ 409 (пользователь нажал «+»); иначе
// количество обрезается (слияние гостевой корзины при входе — оно не
// должно ломать вход). Потолок MAX_QUANTITY — всегда обрезание, так же
// складывает mergeCartItems во фронтенде (lib/merge-cart.ts).
async function addQuantity(
  tx: Db,
  userId: string,
  productId: string,
  amount: number,
  limit: number,
  strict: boolean,
) {
  const key = { userId_productId: { userId, productId } };
  const existing = await tx.cartItem.findUnique({ where: key });
  const total = (existing?.quantity ?? 0) + amount;
  if (strict && total > limit) throw onlyLeft(limit);

  const quantity = Math.min(total, MAX_QUANTITY, limit);
  await tx.cartItem.upsert({
    where: key,
    create: { userId, productId, quantity },
    update: { quantity },
  });
}

export const getCart = (userId: string) => readCart(prisma, userId);

export async function addItem(userId: string, productId: string, amount: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new HttpError(404, "Товар не найден");
  const limit = availableQuantity(product);
  if (limit === 0) throw new HttpError(409, "Товара нет в наличии");

  return inTransaction(async (tx) => {
    await addQuantity(tx, userId, productId, amount, limit, true);
    return readCart(tx, userId);
  });
}

// Уменьшить и убрать можно всегда — в том числе товар, закончившийся, пока
// лежал в корзине. Увеличивать выше остатка нельзя.
export async function setQuantity(userId: string, productId: string, quantity: number) {
  const key = { userId_productId: { userId, productId } };

  return inTransaction(async (tx) => {
    if (quantity === 0) {
      await tx.cartItem.deleteMany({ where: { userId, productId } });
    } else {
      const line = await tx.cartItem.findUnique({ where: key, include: { product: true } });
      if (!line) throw new HttpError(404, "Товара нет в корзине");

      const limit = availableQuantity(line.product);
      if (quantity > line.quantity && quantity > limit) throw onlyLeft(limit);
      await tx.cartItem.update({ where: key, data: { quantity } });
    }
    return readCart(tx, userId);
  });
}

export async function removeItem(userId: string, productId: string) {
  await prisma.cartItem.deleteMany({ where: { userId, productId } });
  return getCart(userId);
}

export async function clear(userId: string) {
  await prisma.cartItem.deleteMany({ where: { userId } });
  return { items: [] };
}

// Слияние гостевой корзины (localStorage) с корзиной аккаунта при входе
// (ТЗ, раздел 5): количества одинаковых товаров суммируются. Устаревшие
// строки гостевой корзины (товар удалён или закончился) пропускаются, а не
// валят весь вход — их id возвращаются в `skipped`.
export async function merge(userId: string, lines: MergeLine[]) {
  const wanted = new Map<string, number>();
  for (const line of lines) {
    wanted.set(line.productId, (wanted.get(line.productId) ?? 0) + line.quantity);
  }

  const found = await prisma.product.findMany({
    where: { id: { in: [...wanted.keys()] } },
    select: { id: true, inStock: true, stock: true },
  });
  // Недоступные (удалены, сняты с наличия, остаток 0) — пропускаем.
  const limits = new Map(found.map((product) => [product.id, availableQuantity(product)] as const));
  const skipped = [...wanted.keys()].filter((id) => !limits.get(id));

  const cart = await inTransaction(async (tx) => {
    for (const [productId, amount] of wanted) {
      const limit = limits.get(productId);
      if (limit) {
        await addQuantity(tx, userId, productId, amount, limit, false);
      }
    }
    return readCart(tx, userId);
  });

  return { ...cart, skipped };
}
