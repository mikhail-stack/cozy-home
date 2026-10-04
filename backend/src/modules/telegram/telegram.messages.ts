// Тексты сообщений бота. Формат уведомления о заказе — дословно из
// docs/cozy-home-tz.md, раздел 8. Обычный текст без parse_mode: названия
// товаров и имена покупателей приходят от людей и не должны ломать разметку.

export interface OrderForNotification {
  number: number;
  name: string;
  phone: string;
  comment: string | null;
  totalPrice: number;
  createdAt: Date;
  items: { quantity: number; price: number; product: { name: string } }[];
}

// Лимит Telegram — 4096 символов; запас на «… и ещё N».
const MAX_MESSAGE_LENGTH = 4000;

// 1840 → «1 840 грн» (обычный пробел, как в ТЗ).
export const formatMoney = (amount: number) =>
  `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} грн`;

// «12:45, 29.08.2026» — по киевскому времени, где магазин и принимает заказы.
export function formatDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Kyiv",
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("hour")}:${part("minute")}, ${part("day")}.${part("month")}.${part("year")}`;
}

export function formatOrderMessage(order: OrderForNotification): string {
  const head = [
    `🛍 Новый заказ #${order.number}`,
    "",
    `👤 Имя: ${order.name}`,
    `📞 Телефон: ${order.phone}`,
    ...(order.comment ? [`💬 Комментарий: ${order.comment}`] : []),
    "",
    "📦 Состав заказа:",
  ].join("\n");
  const tail = [
    "",
    "",
    `💰 Итого: ${formatMoney(order.totalPrice)}`,
    `🕐 Время: ${formatDateTime(order.createdAt)}`,
  ].join("\n");

  const lines = order.items.map(
    (item) =>
      `— ${item.product.name} × ${item.quantity} — ${formatMoney(item.price * item.quantity)}`,
  );

  // Очень длинный заказ обрезаем по списку позиций — шапка и итог остаются.
  const kept: string[] = [];
  let length = head.length + tail.length;
  for (const line of lines) {
    const rest = lines.length - kept.length - 1;
    const reserve = rest > 0 ? 40 : 0;
    if (length + line.length + 1 + reserve > MAX_MESSAGE_LENGTH) break;
    kept.push(line);
    length += line.length + 1;
  }
  if (kept.length < lines.length) kept.push(`… и ещё ${lines.length - kept.length} поз.`);

  return `${head}\n${kept.join("\n")}${tail}`;
}

export const MESSAGES = {
  welcome:
    "👋 Это бот магазина Cozy Home.\n\nЧтобы получать коды восстановления пароля, привяжите Telegram в личном кабинете на сайте: «Безопасность» → «Привязать Telegram».",
  linked: (name: string) => `✅ Готово, ${name}! Telegram привязан к вашему аккаунту Cozy Home.`,
  linkInvalid:
    "Ссылка недействительна или устарела. Создайте новую в личном кабинете: «Безопасность» → «Привязать Telegram».",
  userAlreadyLinked: "К этому аккаунту уже привязан Telegram.",
  chatInUse: "Этот Telegram уже привязан к другому аккаунту Cozy Home.",
  linkByEmailDisabled:
    "Привязка по email отключена из соображений безопасности: так чужой Telegram мог бы получить доступ к вашему аккаунту.\n\nОткройте личный кабинет на сайте → «Безопасность» → «Привязать Telegram» — и перейдите по выданной ссылке.",
  help: "Я отправляю уведомления магазина Cozy Home. Привязать Telegram можно в личном кабинете на сайте: «Безопасность» → «Привязать Telegram».",
} as const;
