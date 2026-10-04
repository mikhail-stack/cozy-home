import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMailMock = vi.fn();
const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }));
vi.mock("nodemailer", () => ({ default: { createTransport: createTransportMock } }));

vi.mock("../config/env.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../config/env.js")>();
  return { env: { ...actual.env } };
});

// mailer.ts кэширует транспорт в переменной модуля (создаётся один раз) —
// чтобы тесты порта/секьюрности не зависели от порядка, каждый тест
// перезагружает модуль заново через vi.resetModules().
async function freshMailer(envPatch: Record<string, unknown>) {
  vi.resetModules();
  const { env } = await import("../config/env.js");
  Object.assign(env, envPatch);
  return import("./mailer.js");
}

const configured = {
  SMTP_HOST: "smtp.example.com",
  SMTP_PORT: 587,
  SMTP_USER: "user",
  SMTP_PASS: "pass",
  SMTP_FROM: "Cozy Home <no-reply@cozyhome.ua>",
};

beforeEach(() => {
  sendMailMock.mockReset();
  createTransportMock.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isMailerConfigured / sendMail без настроек", () => {
  it("без SMTP_HOST ничего не отправляет и возвращает false", async () => {
    const mailer = await freshMailer({ ...configured, SMTP_HOST: undefined });

    expect(mailer.isMailerConfigured()).toBe(false);
    expect(await mailer.sendMail("a@example.com", "Тема", "Текст")).toBe(false);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("без SMTP_USER или SMTP_PASS тоже не настроен", async () => {
    const mailer = await freshMailer({ ...configured, SMTP_USER: undefined });
    expect(mailer.isMailerConfigured()).toBe(false);
  });
});

describe("sendMail", () => {
  it("отправляет письмо с темой, текстом и адресом из SMTP_FROM; порт 587 — без немедленного TLS", async () => {
    sendMailMock.mockResolvedValue({ messageId: "1" });
    const mailer = await freshMailer(configured);

    expect(await mailer.sendMail("a@example.com", "Тема", "Текст письма")).toBe(true);

    expect(sendMailMock).toHaveBeenCalledWith({
      from: "Cozy Home <no-reply@cozyhome.ua>",
      to: "a@example.com",
      subject: "Тема",
      text: "Текст письма",
    });
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: { user: "user", pass: "pass" },
      }),
    );
  });

  it("порт 465 — сразу TLS (secure: true)", async () => {
    sendMailMock.mockResolvedValue({});
    const mailer = await freshMailer({ ...configured, SMTP_PORT: 465 });

    await mailer.sendMail("a@example.com", "т", "т");

    expect(createTransportMock).toHaveBeenCalledWith(expect.objectContaining({ secure: true }));
  });

  it("транспорт создаётся один раз и переиспользуется между письмами", async () => {
    sendMailMock.mockResolvedValue({});
    const mailer = await freshMailer(configured);

    await mailer.sendMail("a@example.com", "т", "т");
    await mailer.sendMail("b@example.com", "т", "т");

    expect(createTransportMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(2);
  });

  it("сбой отправки → false, не бросает, пароль SMTP в лог не попадает", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    sendMailMock.mockRejectedValue(new Error("Connection timeout"));
    const mailer = await freshMailer(configured);

    expect(await mailer.sendMail("a@example.com", "т", "т")).toBe(false);

    expect(log).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(log.mock.calls)).not.toContain("pass");
  });
});

describe("errorText", () => {
  it("достаёт сообщение из Error, иначе — заглушку", async () => {
    const mailer = await freshMailer(configured);
    expect(mailer.errorText(new Error("бум"))).toBe("бум");
    expect(mailer.errorText("не ошибка")).toBe("неизвестная ошибка");
  });
});
