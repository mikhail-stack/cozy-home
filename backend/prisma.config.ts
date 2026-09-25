import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Prisma 7: connection string для CLI (migrate/studio) задаётся тут,
  // не в schema.prisma (см. комментарий у datasource в schema.prisma).
  datasource: {
    url: env("DATABASE_URL"),
  },
});
