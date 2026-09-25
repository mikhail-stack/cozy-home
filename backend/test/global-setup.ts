import { execSync } from "node:child_process";
import pg from "pg";
import "dotenv/config";

// Интеграционные тесты идут в ОТДЕЛЬНОЙ базе (<имя>_test) на том же
// Postgres — дев-базу с реальными данными не трогаем
// (docs/architecture.md, раздел 8.3). Создаём её при первом прогоне и
// накатываем миграции через `prisma migrate deploy`.
export default async function setup() {
  const devUrl = new URL(process.env.DATABASE_URL!);
  const testDbName = `${devUrl.pathname.slice(1)}_test`;

  const admin = new pg.Client({ connectionString: devUrl.toString() });
  await admin.connect();
  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [testDbName]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${testDbName}"`);
  }
  await admin.end();

  const testUrl = new URL(devUrl.toString());
  testUrl.pathname = `/${testDbName}`;
  process.env.DATABASE_URL = testUrl.toString();

  execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
}
