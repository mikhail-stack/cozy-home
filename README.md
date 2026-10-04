# Cozy Home

Интернет-магазин товаров для дома и декора.

Документация — в [docs/](docs/):
- [cozy-home-tz.md](docs/cozy-home-tz.md) — техническое задание
- [architecture.md](docs/architecture.md) — архитектура проекта
- [DESIGN.md](docs/DESIGN.md) — дизайн-система (цвета, типографика, компоненты)

Локальные правила для работы над проектом — в [CLAUDE.md](CLAUDE.md).

## Стек

- **Frontend:** Next.js (App Router) + Zustand + Tailwind CSS
- **Backend:** Node.js + Express + Prisma ORM
- **База данных:** PostgreSQL
- **Изображения:** Cloudinary
- **Уведомления/восстановление пароля:** Telegram-бот (Bot API напрямую через `fetch`, встроен в backend)

## Структура

```
cozy-home/
├── frontend/    # Next.js-приложение
├── backend/     # Express API + Telegram-бот
├── nginx/       # конфиг реверс-прокси для продакшена
├── docs/        # ТЗ, архитектура, дизайн-система
├── docker-compose.yml
└── CLAUDE.md
```

Подробности по каждой части — в `frontend/` и `backend/` (собственные `package.json`, `.env.example`, конфиги).

## Локальный запуск (без Docker)

Требуется Node.js 22+, локальный или удалённый PostgreSQL.

```bash
# Backend
cd backend
cp .env.example .env   # заполнить значения
npm install
npm run prisma:migrate
npm run dev             # http://localhost:4000

# Frontend (в отдельном терминале)
cd frontend
cp .env.example .env
npm install
npm run dev             # http://localhost:3000
```

## Запуск через Docker Compose (для сервера)

```bash
cp .env.example .env               # переменные для postgres/nginx
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d --build
```

Nginx проксирует `/` на frontend и `/api` на backend на порту 80.

## Переменные окружения

- Корень (`.env`) — параметры Postgres и домена для docker-compose.
- `backend/.env` — подключение к БД, секреты JWT, ключи Cloudinary, токен Telegram-бота.
- `frontend/.env` — публичный URL backend API.

Актуальный список переменных — в соответствующих `.env.example`.
