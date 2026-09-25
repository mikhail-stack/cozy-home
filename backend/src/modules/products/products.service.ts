import { HttpError } from "../../lib/errors.js";
import { hasErrorCode } from "../../lib/prisma-errors.js";
import { prisma } from "../../lib/prisma.js";
import { uploadImage } from "../../lib/cloudinary.js";
import { withDerivedInStock } from "./stock.js";
import type { CreateProductInput, UpdateProductInput } from "./products.schemas.js";

type Category = CreateProductInput["category"];

const notFound = () => new HttpError(404, "Товар не найден");

// createdAt, потом id — стабильный порядок для каталога.
export const list = (category?: Category) =>
  prisma.product.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

export async function getById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw notFound();
  return product;
}

export const create = (input: CreateProductInput) =>
  prisma.product.create({ data: withDerivedInStock(input) });

export async function update(id: string, input: UpdateProductInput) {
  try {
    return await prisma.product.update({ where: { id }, data: withDerivedInStock(input) });
  } catch (error) {
    // P2025 — запись для обновления не найдена.
    throw hasErrorCode(error, "P2025") ? notFound() : error;
  }
}

// Удаление: товар из корзин убираем вместе с ним (корзина — временная,
// блокировать удаление из-за неё незачем), но товар из истории заказов
// удалить нельзя (FK RESTRICT) — вместо этого его снимают с наличия.
// Обе операции в одной транзакции: при отказе корзины не теряются.
export async function remove(id: string) {
  try {
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);
  } catch (error) {
    if (hasErrorCode(error, "P2025")) throw notFound();
    if (hasErrorCode(error, "P2003")) {
      throw new HttpError(409, "Товар есть в заказах — снимите его с наличия вместо удаления");
    }
    throw error;
  }
}

export async function uploadImages(files: Express.Multer.File[]): Promise<string[]> {
  if (files.length === 0) {
    throw new HttpError(400, "Выберите хотя бы один файл");
  }
  return Promise.all(files.map((file) => uploadImage(file.buffer)));
}
