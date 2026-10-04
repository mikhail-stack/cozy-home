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
```

Перед первым запуском заполнить в скопированных файлах (подробные
комментарии — прямо в `.env.example`):

- `backend/.env`: `DATABASE_URL` — хост `postgres` (имя сервиса в
  `docker-compose.yml`), не `localhost`; `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`
  — случайные строки (`openssl rand -base64 32`, дважды); `CLIENT_URL` —
  реальный внешний адрес сервера (домен или IP, без порта).
- `frontend/.env`: `NEXT_PUBLIC_API_URL` — тот же внешний адрес с `/api`
  (например `http://ваш-домен-или-ip/api`) — наружу backend виден только
  через nginx, у него самого нет отдельного порта.

```bash
docker compose up -d --build
```

Nginx проксирует `/` на frontend и `/api` на backend на порту 80. Миграции
Prisma (`prisma migrate deploy`) прогоняются автоматически при каждом
старте backend-контейнера — отдельно выполнять их не нужно.

На этом этапе развёртывание — без HTTPS (нет сертификата/домена под TLS);
`NODE_ENV` в `backend/.env` поэтому не выставлен в `production` — иначе
refresh-кука получила бы флаг `Secure` и браузер не возвращал бы её без
HTTPS, разлогинивая пользователей каждые 15 минут. Когда появится домен —
завести certbot в nginx и включить `NODE_ENV=production`.

## Переменные окружения

- Корень (`.env`) — параметры Postgres и домена для docker-compose.
- `backend/.env` — подключение к БД, секреты JWT, ключи Cloudinary, токен Telegram-бота.
- `frontend/.env` — публичный URL backend API.

Актуальный список переменных — в соответствующих `.env.example`.
