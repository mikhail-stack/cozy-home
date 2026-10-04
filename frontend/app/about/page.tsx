import Image from "next/image";
import { API_URL } from "@/lib/api";
import { formatPhoneInput } from "@/lib/phone";
import type { AboutContent } from "@/types/about";

async function loadAbout(): Promise<AboutContent> {
  const res = await fetch(`${API_URL}/about`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Не удалось загрузить страницу: ${res.status}`);
  return (await res.json()) as AboutContent;
}

// Реализовано (пункт 23, подэтап about): контент раньше был статическим
// (см. git-историю) — теперь Server Component с реальным `fetch` на
// GET /api/about (публичный, без apiFetch — Zustand недоступен в Server
// Components), как и главная/страница товара. Пока админ ничего не
// сохранил, бэкенд сам отдаёт значения по умолчанию (about.defaults.ts).
export default async function AboutPage() {
  let about: AboutContent | null = null;
  try {
    about = await loadAbout();
  } catch {
    about = null;
  }

  if (!about) {
    return (
      <div className="mx-auto max-w-[720px] px-24 py-32">
        <p className="font-lunar text-body-sm tracking-body-sm text-stone">
          Не удалось загрузить страницу, попробуйте обновить.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-40">
      <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
        <Image src="/about.png" alt="" fill priority className="object-contain" />
      </div>

      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-40 px-24 pb-32">
        <section className="flex flex-col gap-16">
          <h1 className="font-lunar text-heading tracking-heading text-obsidian">{about.title}</h1>
          <p className="font-lunar text-body-sm tracking-body-sm text-stone">{about.description}</p>
        </section>

        <section className="grid gap-32 sm:grid-cols-2">
          {about.advantages.map((advantage, index) => (
            <div key={`${index}-${advantage.title}`} className="flex flex-col gap-8">
              <Image
                src={advantage.icon}
                alt=""
                width={40}
                height={40}
                className="h-40 w-40 object-contain"
              />
              <span className="font-lunar text-body-sm tracking-body-sm font-bold text-obsidian">
                {String(index + 1).padStart(2, "0")}.
              </span>
              <span className="font-lunar text-body-sm tracking-body-sm font-medium text-obsidian">
                {advantage.title}
              </span>
              <span className="font-lunar text-body-sm tracking-body-sm text-stone">
                {advantage.text}
              </span>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-8">
          <h2 className="font-lunar text-subheading tracking-subheading text-obsidian">Контакты</h2>
          <a
            href={`tel:${about.phone}`}
            className="font-lunar text-body-sm tracking-body-sm text-obsidian hover:underline"
          >
            {formatPhoneInput(about.phone)}
          </a>
          <a
            href={`mailto:${about.email}`}
            className="font-lunar text-body-sm tracking-body-sm text-obsidian hover:underline"
          >
            {about.email}
          </a>
        </section>
      </div>
    </div>
  );
}
