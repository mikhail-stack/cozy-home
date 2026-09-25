import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { HttpError } from "../../lib/errors.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import { hasErrorCode } from "../../lib/prisma-errors.js";
import { prisma } from "../../lib/prisma.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const BCRYPT_ROUNDS = 10;
// Без «Запомнить меня» — сессионная кука и refresh на сутки; с ним —
// постоянная кука на JWT_REFRESH_EXPIRES_IN (30 дней, ТЗ раздел 6).
const SHORT_SESSION_TTL_SECONDS = 24 * 60 * 60;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
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

export async function getUser(id: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new HttpError(401, "Сессия истекла, войдите заново");
  }
  return toPublicUser(user);
}
