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
    <footer className="border-t border-soot bg-limestone">
      <div className="grid gap-32 px-20 py-32 sm:grid-cols-3">
        <div className="flex flex-col gap-7">
          <span className="font-gp text-caption tracking-caption uppercase text-soot">Магазин</span>
          {shopLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-gp text-caption tracking-caption text-soot hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex flex-col gap-7">
          <span className="font-gp text-caption tracking-caption uppercase text-soot">Контакты</span>
          <a
            href="tel:+380000000000"
            className="font-gp text-caption tracking-caption text-soot hover:underline"
          >
            +380 00 000 00 00
          </a>
          <a
            href="mailto:hello@cozyhome.ua"
            className="font-gp text-caption tracking-caption text-soot hover:underline"
          >
            hello@cozyhome.ua
          </a>
        </div>

        <div className="flex flex-col gap-7">
          <span className="font-gp text-caption tracking-caption uppercase text-soot">Мы в соцсетях</span>
          {socialLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="font-gp text-caption tracking-caption text-soot hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-soot px-20 py-16 text-center font-gp text-caption tracking-caption text-soot">
        © {new Date().getFullYear()} Cozy Home. Все права защищены.
      </div>
    </footer>
  );
}
