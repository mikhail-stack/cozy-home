import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { HttpError } from "./errors.js";

const isConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Файл уходит из памяти (multer memoryStorage) прямо в Cloudinary потоком,
// на диск ничего не пишется (docs/architecture.md, раздел 3). Возвращает
// https-URL, который затем сохраняется в Product.images.
export function uploadImage(buffer: Buffer): Promise<string> {
  if (!isConfigured) {
    return Promise.reject(new HttpError(503, "Загрузка изображений не настроена"));
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "cozy-home/products", resource_type: "image" }, (error, result) => {
        if (error || !result) {
          // Ошибка Cloudinary — обычный объект с message, а не Error.
          reject(new Error(error?.message ?? "Cloudinary не вернул результат загрузки"));
          return;
        }
        resolve(result.secure_url);
      })
      .end(buffer);
  });
}
