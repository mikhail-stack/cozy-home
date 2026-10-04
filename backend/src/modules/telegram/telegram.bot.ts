import { errorText, getUpdates, sendMessage, type TelegramUpdate } from "./telegram.api.js";
import { MESSAGES } from "./telegram.messages.js";
import { linkChat } from "./telegram.service.js";

const POLL_TIMEOUT_SECONDS = 25;
const RETRY_DELAY_MS = 5000;

// Обработка одного обновления. Отвечаем только в личных чатах: бота могут
// добавить в группу, и обрабатывать чужие сообщения там незачем.
export async function handleUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message?.text || message.chat.type !== "private") return;

  const chatId = String(message.chat.id);
  const [rawCommand = "", argument] = message.text.trim().split(/\s+/);
  const command = rawCommand.split("@")[0]?.toLowerCase();

  if (command === "/start") {
    if (!argument) {
      await sendMessage(chatId, MESSAGES.welcome);
      return;
    }
    const result = await linkChat(argument, chatId);
    const reply = {
      linked: result.status === "linked" ? MESSAGES.linked(result.name) : "",
      invalid: MESSAGES.linkInvalid,
      "user-already-linked": MESSAGES.userAlreadyLinked,
      "chat-in-use": MESSAGES.chatInUse,
    }[result.status];
    await sendMessage(chatId, reply);
    return;
  }

  // /link email из ТЗ (раздел 7) намеренно не работает — см. TelegramLinkToken
  // в schema.prisma: привязка без подтверждения владельца email даёт захват аккаунта.
  await sendMessage(chatId, command === "/link" ? MESSAGES.linkByEmailDisabled : MESSAGES.help);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Long polling в фоне (docs/architecture.md, раздел 3): бот живёт внутри
// backend-процесса. Возвращает функцию остановки. Ошибка сети или конфликт
// (второй экземпляр с тем же токеном) — пауза и повтор, процесс не падает.
export function startPolling(): () => void {
  const controller = new AbortController();
  let offset = 0;

  void (async () => {
    while (!controller.signal.aborted) {
      try {
        const updates = await getUpdates(offset, POLL_TIMEOUT_SECONDS, controller.signal);
        for (const update of updates) {
          offset = update.update_id + 1;
          try {
            await handleUpdate(update);
          } catch (error) {
            console.error("Telegram: ошибка обработки сообщения:", errorText(error));
          }
        }
      } catch (error) {
        if (controller.signal.aborted) break;
        console.error("Telegram: ошибка опроса, повтор через 5 с:", errorText(error));
        await sleep(RETRY_DELAY_MS);
      }
    }
  })();

  return () => controller.abort();
}
