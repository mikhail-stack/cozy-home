import { z } from "zod";

// Категории — те же значения, что в enum ProductCategory (schema.prisma)
// и в frontend/types/product.ts.
export const CATEGORIES = ["candles", "textile", "kitchen", "decor"] as const;

const required = (message: string) => ({ required_error: message, invalid_type_error: message });

// Только https-URL (Cloudinary) или путь от корня сайта — статические фото
// из frontend/public (например, "/products/soy-wax-main.avif"), которыми
// заполнены стартовые товары. Любые другие схемы (javascript:, data:) отвергаем.
// null — «не учитывать остаток» (см. Product.stock в schema.prisma).
const stock = z
  .number(required("Остаток должен быть числом"))
  .int("Остаток должен быть целым числом")
  .min(0, "Остаток не может быть отрицательным")
  .max(100000, "Слишком большой остаток")
  .nullable();

const imageRef = z
  .string(required("Некорректная ссылка на изображение"))
  .refine((value) => /^https:\/\/\S+$/.test(value) || /^\/[^\s/]\S*$/.test(value), {
    message: "Некорректная ссылка на изображение",
  });

export const createProductSchema = z.object({
  name: z.string(required("Введите название")).trim().min(1, "Введите название"),
  description: z.string(required("Введите описание")).trim().min(1, "Введите описание"),
  // Целые гривны без копеек (см. комментарий у Product.price в schema.prisma).
  price: z
    .number(required("Введите цену"))
    .int("Цена должна быть целым числом")
    .positive("Цена должна быть больше нуля"),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: "Выберите категорию" }) }),
  images: z.array(imageRef).max(10, "Не больше 10 изображений").default([]),
  inStock: z.boolean().default(true),
  stock: stock.optional(),
});

// PATCH: любые поля из создания, но хотя бы одно. .default() из create
// здесь не должен подставляться — иначе пустой PATCH затёр бы images.
export const updateProductSchema = createProductSchema
  .partial()
  .extend({
    images: z.array(imageRef).max(10, "Не больше 10 изображений").optional(),
    inStock: z.boolean().optional(),
    stock: stock.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Нет полей для обновления",
  });

export const listQuerySchema = z.object({
  category: z
    .enum(CATEGORIES, { errorMap: () => ({ message: "Неизвестная категория" }) })
    .optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
