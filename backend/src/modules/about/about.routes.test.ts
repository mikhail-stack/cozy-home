import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { signAccessToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";
import { DEFAULT_ABOUT } from "./about.defaults.js";

// Интеграционные тесты на реальной БД. Сценарии — ТЗ, разделы 4.4 (страница
// «О магазине» видна всем) и 9 (редактирует администратор: заголовок,
// основной текст, преимущества «иконка + заголовок + текст», контакты).
const app = createApp();

interface AboutBody {
  title: string;
  description: string;
  advantages: { icon: string; title: string; text: string }[];
  phone: string;
  email: string;
  updatedAt: string | null;
  message: string;
}
const json = (res: request.Response) => res.body as AboutBody;

const userToken = signAccessToken({ sub: "user-id", role: "user" });
const adminToken = signAccessToken({ sub: "admin-id", role: "admin" });

const valid = () => ({
  title: "Cozy Home Studio",
  description: "Новый основной текст",
  advantages: [
    { icon: "/handmade.png", title: "Ручная работа", text: "Всё делаем руками" },
    {
      icon: "https://res.cloudinary.com/demo/image/upload/icon.png",
      title: "Доставка",
      text: "По всей Украине",
    },
  ],
  phone: "0501234567",
  email: "Hello@CozyHome.ua",
});
const save = (body: object = valid()) =>
  request(app).put("/api/about").set("Authorization", `Bearer ${adminToken}`).send(body);

beforeEach(async () => {
  await prisma.about.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /api/about", () => {
  it("гостю без токена отдаётся содержимое по умолчанию, пока админ ничего не сохранил", async () => {
    const res = await request(app).get("/api/about");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ...DEFAULT_ABOUT, updatedAt: null });
    expect(json(res).advantages.length).toBeGreaterThanOrEqual(3);
  });

  it("после сохранения отдаёт сохранённое, а не значения по умолчанию", async () => {
    await save();

    const res = await request(app).get("/api/about");

    expect(json(res)).toMatchObject({
      title: "Cozy Home Studio",
      description: "Новый основной текст",
      phone: "+380501234567",
      email: "hello@cozyhome.ua",
    });
    expect(json(res).advantages).toEqual(valid().advantages);
    expect(json(res).updatedAt).not.toBeNull();
  });
});

describe("PUT /api/about", () => {
  it("без токена → 401, с ролью user → 403, ничего не сохраняется", async () => {
    const guest = await request(app).put("/api/about").send(valid());
    const user = await request(app)
      .put("/api/about")
      .set("Authorization", `Bearer ${userToken}`)
      .send(valid());

    expect(guest.status).toBe(401);
    expect(user.status).toBe(403);
    expect(await prisma.about.count()).toBe(0);
  });

  it("админ сохраняет; ответ — уже сохранённое содержимое, телефон и email нормализованы", async () => {
    const res = await save();

    expect(res.status).toBe(200);
    expect(json(res)).toMatchObject({
      title: "Cozy Home Studio",
      phone: "+380501234567",
      email: "hello@cozyhome.ua",
    });
  });

  it("повторное сохранение заменяет содержимое целиком и не плодит строк", async () => {
    await save();
    await save({
      ...valid(),
      title: "Другой заголовок",
      advantages: [{ icon: "/gift_packaging.png", title: "Упаковка", text: "Красиво" }],
    });

    const res = await request(app).get("/api/about");

    expect(await prisma.about.count()).toBe(1);
    expect(json(res).title).toBe("Другой заголовок");
    expect(json(res).advantages).toHaveLength(1);
  });

  it("пробелы по краям текстов обрезаются", async () => {
    const res = await save({
      ...valid(),
      title: "  Заголовок  ",
      advantages: [{ icon: "/handmade.png", title: " А ", text: " Б " }],
    });

    expect(json(res).title).toBe("Заголовок");
    expect(json(res).advantages[0]).toMatchObject({ title: "А", text: "Б" });
  });

  it("телефон принимается в любом украинском виде и хранится единым", async () => {
    for (const phone of ["+380501234567", "380501234567", "(050) 123-45-67"]) {
      const res = await save({ ...valid(), phone });
      expect(json(res).phone).toBe("+380501234567");
    }
  });

  describe("валидация → 400", () => {
    const bad: [string, object, string][] = [
      ["нет заголовка", { title: " " }, "Введите заголовок"],
      ["заголовок слишком длинный", { title: "а".repeat(101) }, "Слишком длинный заголовок"],
      ["нет основного текста", { description: "" }, "Введите основной текст"],
      [
        "основной текст слишком длинный",
        { description: "а".repeat(3001) },
        "Слишком длинный основной текст",
      ],
      ["преимущества не переданы", { advantages: undefined }, "Добавьте преимущества"],
      ["пустой список преимуществ", { advantages: [] }, "Добавьте хотя бы одно преимущество"],
      [
        "слишком много преимуществ",
        {
          advantages: Array.from({ length: 9 }, () => ({
            icon: "/handmade.png",
            title: "А",
            text: "Б",
          })),
        },
        "Не больше 8 преимуществ",
      ],
      [
        "преимущество без заголовка",
        { advantages: [{ icon: "/handmade.png", title: "", text: "Б" }] },
        "Введите заголовок преимущества",
      ],
      [
        "преимущество без текста",
        { advantages: [{ icon: "/handmade.png", title: "А", text: " " }] },
        "Введите текст преимущества",
      ],
      [
        "опасная иконка (javascript:)",
        { advantages: [{ icon: "javascript:alert(1)", title: "А", text: "Б" }] },
        "Некорректная ссылка на изображение",
      ],
      [
        "иконка data:",
        { advantages: [{ icon: "data:image/png;base64,AAA", title: "А", text: "Б" }] },
        "Некорректная ссылка на изображение",
      ],
      [
        "иконка http без TLS",
        { advantages: [{ icon: "http://example.com/a.png", title: "А", text: "Б" }] },
        "Некорректная ссылка на изображение",
      ],
      [
        "иконка //чужой-хост",
        { advantages: [{ icon: "//evil.example/a.png", title: "А", text: "Б" }] },
        "Некорректная ссылка на изображение",
      ],
      ["нет телефона", { phone: "" }, "Введите телефон"],
      ["не украинский телефон", { phone: "+48501234567" }, "Введите корректный номер телефона"],
      ["нет email", { email: "" }, "Введите email"],
      ["некорректный email", { email: "not-an-email" }, "Введите корректный email"],
    ];

    it.each(bad)("%s", async (_name, patch, expected) => {
      const res = await save({ ...valid(), ...patch });

      expect(res.status).toBe(400);
      expect(json(res).message).toBe(expected);
      expect(await prisma.about.count()).toBe(0);
    });
  });

  it("неполное тело (без полей) не затирает сохранённое", async () => {
    await save();

    const res = await save({});

    expect(res.status).toBe(400);
    expect(json(await request(app).get("/api/about")).title).toBe("Cozy Home Studio");
  });

  it("предел в 8 преимуществ включительно допустим", async () => {
    const res = await save({
      ...valid(),
      advantages: Array.from({ length: 8 }, (_, i) => ({
        icon: "/handmade.png",
        title: `П${i}`,
        text: "Б",
      })),
    });
    expect(res.status).toBe(200);
    expect(json(res).advantages).toHaveLength(8);
  });
});
