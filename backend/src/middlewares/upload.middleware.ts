import multer from "multer";
import { HttpError } from "../lib/errors.js";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 10;

// memoryStorage: файл остаётся в буфере и стримится в Cloudinary,
// на диск сервера не попадает. Лимиты — защита от загрузки чего угодно
// и сколько угодно (эндпоинт только для admin, но токен могут украсть).
export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES_PER_UPLOAD },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
      callback(null, true);
    } else {
      callback(new HttpError(400, "Разрешены только изображения"));
    }
  },
}).array("images", MAX_FILES_PER_UPLOAD);
