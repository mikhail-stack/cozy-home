import "dotenv/config";
import { z } from "zod";

// "30d"/"15m"/"1h" → секунды. Только эти суффиксы — остальное отвергаем
// сразу при старте, а не молча в рантайме.
const durationSchema = z
  .string()
  .regex(/^\d+[smhd]$/, 'Формат длительности: число + s/m/h/d, например "15m"')
  .transform((value) => {
    const unit = { s: 1, m: 60, h: 3600, d: 86400 }[value.slice(-1) as "s" | "m" | "h" | "d"];
    return Number(value.slice(0, -1)) * unit;
  });

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    CLIENT_URL: z.string().url().default("http://localhost:3000"),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(1),
    JWT_REFRESH_SECRET: z.string().min(1),
    JWT_ACCESS_EXPIRES_IN: durationSchema.default("15m"),
    JWT_REFRESH_EXPIRES_IN: durationSchema.default("30d"),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== "production") return;
    // Плейсхолдер из .env.example в проде — это подделываемые токены.
    for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const) {
      if (value[key] === "change-me" || value[key].length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: "В production секрет должен быть уникальным и не короче 32 символов",
        });
      }
    }
  });

// Одна точка чтения process.env: приложение падает на старте с понятным
// списком проблем, а не в середине запроса (docs/architecture.md, раздел 3).
// JWT_*_EXPIRES_IN после разбора — в секундах.
export const env = envSchema.parse(process.env);
