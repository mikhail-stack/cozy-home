import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";

export const isMailerConfigured = () => Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

// Ленивая инициализация: без настроек почты (dev без SMTP) транспорт вообще
// не создаётся. 465 — неявный TLS с установки соединения, остальные порты
// (587, 25) — STARTTLS.
let transporter: Transporter | null = null;
function getTransporter(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

// Не бросает: сбой почты не должен ронять запрос пользователя (как
// sendMessage в modules/telegram/telegram.api.ts) — результат «отправлено
// или нет» возвращается булевым значением, пароль/учётные данные в лог не попадают.
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  if (!isMailerConfigured()) return false;
  try {
    await getTransporter().sendMail({ from: env.SMTP_FROM, to, subject, text });
    return true;
  } catch (error) {
    console.error("Почта: не удалось отправить письмо:", errorText(error));
    return false;
  }
}

export const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "неизвестная ошибка";
