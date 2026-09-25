import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

// Prisma 7 — Rust-движок убран, клиент обязан работать через driver
// adapter (@prisma/adapter-pg поверх node-postgres). Синглтон, чтобы не
// плодить отдельный пул соединений на каждый импорт (docs/architecture.md,
// раздел 3: "PrismaClient — синглтон").
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
