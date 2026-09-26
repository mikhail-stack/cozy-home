import { prisma } from "../../lib/prisma.js";
import { DEFAULT_ABOUT } from "./about.defaults.js";
import type { AboutContent } from "./about.schemas.js";

const ABOUT_ID = "about";

// updatedAt — null, пока админ ничего не сохранял (отдаются значения по умолчанию).
export async function getAbout() {
  const row = await prisma.about.findUnique({ where: { id: ABOUT_ID } });
  if (!row) return { ...DEFAULT_ABOUT, updatedAt: null };

  return {
    title: row.title,
    description: row.description,
    // Пишется только через aboutSchema, поэтому форма известна.
    advantages: row.advantages as AboutContent["advantages"],
    phone: row.phone,
    email: row.email,
    updatedAt: row.updatedAt,
  };
}

export async function saveAbout(content: AboutContent) {
  await prisma.about.upsert({
    where: { id: ABOUT_ID },
    create: { id: ABOUT_ID, ...content },
    update: content,
  });
  return getAbout();
}
