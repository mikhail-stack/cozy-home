import bcrypt from "bcryptjs";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { HttpError } from "../../lib/errors.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import { sendMail } from "../../lib/mailer.js";
import { hasErrorCode } from "../../lib/prisma-errors.js";
import { prisma } from "../../lib/prisma.js";
import { RESET_EMAIL_SUBJECT, resetCodeEmail } from "./auth.emails.js";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from "./auth.schemas.js";

const BCRYPT_ROUNDS = 10;
// Без «Запомнить меня» — сессионная кука и refresh на сутки; с ним —
// постоянная кука на JWT_REFRESH_EXPIRES_IN (30 дней, ТЗ раздел 6).
const SHORT_SESSION_TTL_SECONDS = 24 * 60 * 60;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "user" | "admin";
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  // true → постоянная кука (maxAge = refreshTtlSeconds), false → сессионная.
  persistent: boolean;
  refreshTtlSeconds: number;
}

// Пароль (хеш) наружу не уходит: собираем публичного пользователя явно,
// а не «вычёркиваем» поле из записи БД.
const toPublicUser = (user: PublicUser): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

function issueTokens(user: PublicUser, persistent: boolean): AuthResult {
  const refreshTtlSeconds = persistent ? env.JWT_REFRESH_EXPIRES_IN : SHORT_SESSION_TTL_SECONDS;
  const payload = { sub: user.id, role: user.role };
  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload, refreshTtlSeconds),
    persistent,
    refreshTtlSeconds,
  };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const emailTaken = new HttpError(409, "Такой email уже зарегистрирован");

  if (await prisma.user.findUnique({ where: { email: input.email } })) {
    throw emailTaken;
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      },
    });
    // После регистрации пользователь залогинен (ТЗ раздел 6) — как при
    // обычном входе без «запомнить меня».
    return issueTokens(user, false);
  } catch (error) {
    // Гонка: два запроса с одним email прошли проверку выше одновременно.
    throw hasErrorCode(error, "P2002") ? emailTaken : error;
  }
}

// Хеш для сравнения, когда пользователя с таким email нет: время ответа
// не должно выдавать, существует ли email (bcrypt.compare — единственная
// «долгая» операция).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordMatches = await bcrypt.compare(input.password, user?.password ?? DUMMY_HASH);

  if (!user || !passwordMatches) {
    // Одно и то же сообщение для «нет такого email» и «неверный пароль».
    throw new HttpError(401, "Неверный email или пароль");
  }
  return issueTokens(user, input.rememberMe);
}

// Refresh без ротации: выдаём новый access-токен, сама кука остаётся.
// Пользователь перечитывается из БД — актуальные роль/имя и отсекаются
// удалённые аккаунты.
export async function refresh(refreshToken: string | undefined) {
  const payload = refreshToken ? verifyRefreshToken(refreshToken) : null;
  const user = payload ? await prisma.user.findUnique({ where: { id: payload.sub } }) : null;

  if (!user) {
    throw new HttpError(401, "Сессия истекла, войдите заново");
  }
  return {
    user: toPublicUser(user),
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
  };
}

const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;

// Хеш привязан к userId — коллизия кода (1 на миллион) у двух разных
// пользователей не бьётся в один и тот же codeHash (поле @unique).
const hashResetCode = (userId: string, code: string) =>
  createHash("sha256").update(`${userId}:${code}`).digest("hex");

// crypto.randomInt — равномерное распределение (в отличие от Math.random()),
// важно для шестизначного кода, который целиком и есть секрет.
const generateResetCode = () => String(randomInt(1_000_000)).padStart(6, "0");

// Сообщение не выдаёт, зарегистрирован ли email (ТЗ не описывает этот случай
// явно, но раскрывать существование аккаунта не стоит) — вызывающий код
// (controller) всегда отвечает одинаково, независимо от результата.
export async function requestPasswordReset(input: ForgotPasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) return;

  const code = generateResetCode();
  const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MS);
  await prisma.$transaction([
    // У пользователя действует один код — новый запрос аннулирует предыдущий;
    // заодно чистятся чужие просроченные записи.
    prisma.passwordResetCode.deleteMany({
      where: { OR: [{ userId: user.id }, { expiresAt: { lt: new Date() } }] },
    }),
    prisma.passwordResetCode.create({
      data: { codeHash: hashResetCode(user.id, code), userId: user.id, expiresAt },
    }),
  ]);

  await sendMail(user.email, RESET_EMAIL_SUBJECT, resetCodeEmail(code));
}

export async function resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
  const invalidCode = new HttpError(400, "Неверный код");
  const expiredCode = new HttpError(400, "Код устарел, запросите новый");

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw invalidCode;

  const record = await prisma.passwordResetCode.findFirst({ where: { userId: user.id } });
  if (!record) throw invalidCode;
  if (record.expiresAt <= new Date()) {
    await prisma.passwordResetCode.deleteMany({ where: { id: record.id } });
    throw expiredCode;
  }
  // Перебор исчерпан — код сгорает, как просроченный: нужен новый запрос.
  if (record.attempts >= MAX_RESET_ATTEMPTS) {
    await prisma.passwordResetCode.deleteMany({ where: { id: record.id } });
    throw expiredCode;
  }

  const matches = timingSafeEqual(
    Buffer.from(hashResetCode(user.id, input.code)),
    Buffer.from(record.codeHash),
  );
  if (!matches) {
    await prisma.passwordResetCode.updateMany({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw invalidCode;
  }

  const password = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password } }),
    // Весь код (и его попытки) больше не нужен — использован.
    prisma.passwordResetCode.deleteMany({ where: { userId: user.id } }),
  ]);
  return { message: "Пароль успешно изменён" };
}

export async function getUser(id: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new HttpError(401, "Сессия истекла, войдите заново");
  }
  return toPublicUser(user);
}

// Имя/email/телефон правятся по месту, пароль — отдельным эндпоинтом ниже
// (changePassword). Email проверяется на занятость явно, да ещё и на гонку
// через уникальный индекс — как в register().
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<PublicUser> {
  const emailTaken = new HttpError(409, "Такой email уже зарегистрирован");

  if (input.email !== undefined) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing && existing.id !== userId) throw emailTaken;
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
      },
    });
    return toPublicUser(user);
  } catch (error) {
    if (hasErrorCode(error, "P2002")) throw emailTaken;
    // P2025 — профиль правит токен удалённого пользователя.
    throw hasErrorCode(error, "P2025")
      ? new HttpError(401, "Сессия истекла, войдите заново")
      : error;
  }
}

// Текущий пароль обязателен — иначе открытая сессия на чужом/общем
// компьютере позволяла бы перехватить аккаунт одной сменой пароля.
export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(401, "Сессия истекла, войдите заново");

  if (!(await bcrypt.compare(input.currentPassword, user.password))) {
    throw new HttpError(400, "Неверный текущий пароль");
  }

  const password = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password } });
  return { message: "Пароль успешно изменён" };
}
