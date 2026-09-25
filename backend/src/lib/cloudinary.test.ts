import { describe, expect, it } from "vitest";
import { HttpError } from "./errors.js";
import { uploadImage } from "./cloudinary.js";

describe("uploadImage без ключей Cloudinary", () => {
  it("отвечает 503, а не падает 500 и не уходит в сеть", async () => {
    const error = await uploadImage(Buffer.from("x")).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(503);
    expect((error as HttpError).message).toBe("Загрузка изображений не настроена");
  });
});
