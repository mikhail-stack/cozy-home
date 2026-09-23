const shopLinks = [
  { href: "/about", label: "О магазине" },
  { href: "/profile", label: "Личный кабинет" },
];

const socialLinks = [
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://t.me/cozyhomebot", label: "Telegram" },
];

export function Footer() {
  return (
    <footer className="bg-beige">
      <div className="grid gap-32 px-24 py-40 sm:grid-cols-3">
        <div className="flex flex-col gap-10">
          <span className="text-caption font-medium uppercase text-ink">Магазин</span>
          {shopLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-caption text-ink hover:text-forest">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex flex-col gap-10">
          <span className="text-caption font-medium uppercase text-ink">Контакты</span>
          <a href="tel:+380000000000" className="text-caption text-ink hover:text-forest">
            +380 00 000 00 00
          </a>
          <a href="mailto:hello@cozyhome.ua" className="text-caption text-ink hover:text-forest">
            hello@cozyhome.ua
          </a>
        </div>

        <div className="flex flex-col gap-10">
          <span className="text-caption font-medium uppercase text-ink">Мы в соцсетях</span>
          {socialLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="text-caption text-ink hover:text-forest"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-terracotta/50 px-24 py-16 text-center text-caption text-ink">
        © {new Date().getFullYear()} Cozy Home. Все права защищены.
      </div>
    </footer>
  );
}
