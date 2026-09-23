# CLAUDE.md — правила работы над Cozy Home

Локальные правила для этого проекта. Дополняют (не заменяют) глобальные настройки — здесь только то, что специфично именно для Cozy Home.

## Документация — читать в первую очередь

- [docs/cozy-home-tz.md](docs/cozy-home-tz.md) — техническое задание: страницы, сценарии, роли, сущности БД.
- [docs/architecture.md](docs/architecture.md) — архитектура: структура папок, разделение frontend/backend, деплой.
- [docs/DESIGN.md](docs/DESIGN.md) — дизайн-система: цвета, типографика, компоненты, do's/don'ts.

Перед архитектурными решениями или вёрсткой — сверяться с этими файлами, а не придумывать заново.

## Дизайн-система (docs/DESIGN.md)

Действует третья версия системы — **Nornorm** (скандинавский шоурум мебели), заменила две предыдущие (монохромная «UY Studio», тёплая кремово-шалфейная) целиком.

- Все токены (цвета, типографика, spacing) вшиты в [frontend/app/globals.css](frontend/app/globals.css) блоком `@theme`. Новые токены не изобретаем — используем `--color-canvas-white/bone/ash/stone/graphite/ink/obsidian/cobalt-ink`, `--text-caption…display` с парным `--tracking-*`, `--spacing-4…160`. Радиусы не переопределяем — берём стандартные `rounded-lg` (8px) и `rounded-full` (9999px) из Tailwind.
- **Cobalt Ink (`#1e37a0`) — единственный цветной акцент**, используется строго для логотипа, primary-кнопок и активных состояний (например, активная пилюля фильтра). Нигде больше цвет не применяется — весь остальной интерфейс на серой шкале.
- Шрифт Lunar недоступен — заменён на Inter (`lib/fonts.ts`, веса 400/500/700). На каждом текстовом размере обязателен парный отрицательный tracking (сигнатура системы, -0.03em).
- Кнопки — только pill-shaped (`rounded-full`), двух видов: `primary` (заливка Cobalt Ink) и `ghost` (прозрачная, рамка Obsidian). Другой формы кнопок в системе нет.
- Без теней нигде. Разделение блоков — через поверхности (Canvas White / Bone), не через рамки; hairline-рамки (`border-ash`/`border-graphite`) допустимы только в функциональных списках/таблицах (корзина, админка), не на маркетинговых блоках.
- Логотип — реальный файл `frontend/public/logo.png` (не токен-дизайн из файла): цвет не перекрашивать под Cobalt.
- Компонентов Input/Modal/Select в файле дизайна нет (Nornorm — сайт без форм) — их стиль экстраполирован из общей системы (Ash-поверхность, `rounded-lg`, фокус Cobalt Ink) и не описан буквально ни в одном компоненте DESIGN.md.

## Технические конвенции

- **Backend** организован по доменам: новая сущность = новая папка `backend/src/modules/<domain>/` с `*.routes.ts`, `*.controller.ts`, `*.service.ts`. Не размазывать логику по техническим слоям (`controllers/`, `models/` на весь проект).
- **Frontend**: состояние — только в Zustand-сторах (`frontend/store/`), без Redux/Context для глобального state. Компоненты раскладываются по доменам в `frontend/components/*` (`catalog/`, `cart/`, `product/`, `layout/`, `ui/`).
- Tailwind v4 конфигурируется только через `@theme` в `app/globals.css` — отдельный `tailwind.config.js`/`.ts` не создаём (см. `docs/DESIGN.md` — источник токенов).
- Вся коммуникация фронта с бэкендом — через единую обёртку `frontend/lib/api.ts` (авто-подстановка токена, авто-refresh при 401). Прямых `fetch` из компонентов избегать.
- После правки `backend/prisma/schema.prisma` — прогонять `npm run prisma:migrate` в `backend/` и коммитить сгенерированную миграцию.
- Гостевая корзина — только `localStorage` (Zustand persist), серверная `CartItem` — только для авторизованных пользователей. Не путать эти два пути.
- Telegram-бот — часть `backend` (`src/modules/telegram`), отдельным процессом/сервисом не выносить.
- Монорепо без workspaces (npm/pnpm workspaces, Turborepo и т.п. не используем) — `frontend/` и `backend/` полностью независимы, каждый ставится и собирается отдельно.
- В обоих пакетах настроен Prettier (`.prettierrc.json`, `.prettierignore`) — перед коммитом прогонять `npm run format` в изменённом пакете; `eslint-config-prettier` уже отключает конфликтующие стилистические правила ESLint.
- В обоих пакетах включён типизированный ESLint (`typescript-eslint` `recommendedTypeChecked` + `projectService`) — ловит реальные баги вроде забытого `await`/floating promises, не только синтаксис. Область действия — только файлы внутри `tsconfig.json` (`src/**/*.ts` в backend, `**/*.{ts,tsx}` во frontend); корневые `*.config.mjs` под это не подпадают. При появлении `no-unsafe-*` ошибок на внешних API (`fetch`, `JSON.parse` и т.п.) — приводить тип явным `as`, а не неявным присваиванием.

## Прочее

- Секреты — только в `.env` файлах (см. `.env.example` в корне, `frontend/`, `backend/`), никогда не коммитить реальные значения.
