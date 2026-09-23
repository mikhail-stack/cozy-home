const shopLinks = [
  { href: "/about", label: "О магазине" },
  { href: "/profile", label: "Личный кабинет" },
];

const socialLinks = [
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://t.me/cozyhomebot", label: "Telegram" },
];

// Bone-поверхность отделяет футер от Canvas-контента выше без рамки —
// система разделяет секции поверхностями, не бордерами (docs/DESIGN.md:
// "Build section backgrounds from Canvas White and Bone only").
export function Footer() {
  return (
    <footer className="bg-bone">
      <div className="grid gap-32 px-24 py-64 sm:grid-cols-3">
        <div className="flex flex-col gap-12">
          <span className="font-lunar text-caption tracking-caption font-medium uppercase text-stone">
            Магазин
          </span>
          {shopLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-lunar text-body-sm tracking-body-sm text-obsidian hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex flex-col gap-12">
          <span className="font-lunar text-caption tracking-caption font-medium uppercase text-stone">
            Контакты
          </span>
          <a
            href="tel:+380000000000"
            className="font-lunar text-body-sm tracking-body-sm text-obsidian hover:underline"
          >
            +380 00 000 00 00
          </a>
          <a
            href="mailto:hello@cozyhome.ua"
            className="font-lunar text-body-sm tracking-body-sm text-obsidian hover:underline"
          >
            hello@cozyhome.ua
          </a>
        </div>

        <div className="flex flex-col gap-12">
          <span className="font-lunar text-caption tracking-caption font-medium uppercase text-stone">
            Мы в соцсетях
          </span>
          {socialLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="font-lunar text-body-sm tracking-body-sm text-obsidian hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="px-24 py-16 text-center font-lunar text-caption tracking-caption text-stone">
        © {new Date().getFullYear()} Cozy Home. Все права защищены.
      </div>
    </footer>
  );
}
