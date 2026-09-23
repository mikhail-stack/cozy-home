# Архитектура — Cozy Home

> Простая, но масштабируемая архитектура интернет-магазина на стеке Next.js + Express + PostgreSQL/Prisma

---

## 1. Общий подход

- **Монорепозиторий** из двух независимых частей: `frontend/` (Next.js) и `backend/` (Express + Prisma). Никаких микросервисов, отдельного BFF-слоя или очередей — при таком масштабе это лишняя сложность.
- Frontend **никогда** не обращается к БД или Cloudinary напрямую — только через REST API бэкенда (`/api/...`). Это единственная точка контракта между частями.
- Telegram-бот — не отдельный сервис, а модуль внутри `backend`, использующий тот же Prisma-клиент. Отдельный процесс для него не нужен: нагрузка небольшая, а деплой одного процесса вместо двух проще.
- Код организован **по доменам** (products, orders, auth…), а не по техническим слоям (models/controllers/views вперемешку) — так проще добавлять новые сущности в будущем, не трогая всё подряд.

```
cozy-home/
├── frontend/            # Next.js (App Router)
├── backend/             # Express + Prisma + Telegram-бот
├── docker-compose.yml   # для развёртывания на сервере
├── .env.example
└── README.md
```

---

## 2. Frontend (`frontend/`)

```
frontend/
├── app/
│   ├── layout.tsx                     # корневой layout: Header, Footer, провайдеры
│   ├── page.tsx                       # / — главная
│   ├── about/page.tsx                 # /about
│   ├── products/[id]/page.tsx         # /products/:id
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   ├── profile/page.tsx               # требует роль user/admin
│   └── admin/
│       ├── layout.tsx                 # проверка роли admin, боковое меню
│       ├── products/page.tsx
│       ├── orders/page.tsx
│       ├── about/page.tsx
│       └── users/page.tsx
├── components/
│   ├── layout/        # Header, Footer
│   ├── catalog/       # ProductCard, ProductGrid, CategoryFilter
│   ├── cart/          # CartDrawer, CartItemRow, CheckoutModal
│   ├── product/       # Gallery, RelatedProducts, Breadcrumbs
│   └── ui/             # Button, Input, Modal — переиспользуемые примитивы
├── store/              # Zustand
│   ├── cart.store.ts   # товары, +/-, persist в localStorage для гостя
│   ├── auth.store.ts   # текущий пользователь, access token (только в памяти)
│   └── ui.store.ts     # открыт ли drawer корзины / модалка оформления
├── lib/
│   ├── api.ts          # обёртка над fetch: базовый URL, авто-подстановка токена, авто-refresh при 401
│   └── merge-cart.ts   # отправка localStorage-корзины на бэкенд после логина
├── types/               # общие TS-типы: Product, Order, User и т.д.
├── middleware.ts        # редиректы неавторизованных с /profile и /admin
└── public/
```

**Ключевые решения:**

- **Zustand-сторы = единственный источник состояния на клиенте**, никакого прокидывания пропсов через 5 уровней. `cart.store.ts` для гостя автоматически синхронизируется с `localStorage` (через `persist` middleware Zustand); для авторизованного пользователя источником истины становится бэкенд, а стор просто отражает ответы API.
- **Access token хранится только в памяти** (в `auth.store.ts`), не в `localStorage` — снижает риск XSS-кражи токена. При перезагрузке страницы `api.ts` дергает `/auth/refresh` (используя `httpOnly` refresh-cookie), чтобы восстановить сессию.
- **`middleware.ts`** делает первичную (UX) проверку доступа к `/admin` и `/profile` на edge — редиректит неавторизованных без лишнего мигания страницы. Финальная проверка прав всегда остаётся на бэкенде.
- Категории на главной, количество в корзине и пересчёт суммы — чисто клиентские операции без похода на сервер (кроме персистентной корзины авторизованного юзера).

---

## 3. Backend (`backend/`)

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/          # регистрация, логин, refresh, telegram-код восстановления
│   │   ├── users/         # профиль, админский список пользователей
│   │   ├── products/      # CRUD товаров, публичный листинг/фильтр
│   │   ├── cart/          # серверная корзина + merge гостевой корзины
│   │   ├── orders/        # создание заказа, статусы, фильтры для админки
│   │   ├── about/         # редактируемый контент страницы «О магазине»
│   │   └── telegram/      # бот: уведомления о заказах, коды восстановления
│   │       (каждый модуль: *.routes.ts, *.controller.ts, *.service.ts)
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # проверка JWT + роли (guest/user/admin)
│   │   ├── error.middleware.ts    # единый обработчик ошибок
│   │   └── upload.middleware.ts   # multer -> Cloudinary
│   ├── lib/
│   │   ├── prisma.ts       # синглтон PrismaClient
│   │   ├── cloudinary.ts
│   │   └── jwt.ts          # sign/verify access и refresh токенов
│   ├── config/
│   │   └── env.ts          # чтение и валидация переменных окружения
│   ├── app.ts               # сборка Express-приложения: middlewares + роуты
│   └── server.ts            # старт HTTP-сервера + запуск Telegram-бота
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── .env
```

**Ключевые решения:**

- **Модульная структура по доменам**: каждый раздел ТЗ (товары, заказы, юзеры…) — отдельная папка с роутами/контроллером/сервисом. Контроллер разбирает `req`/`res`, сервис содержит бизнес-логику и обращения к Prisma. Это даёт понятную границу и позволяет при росте проекта вынести любой модуль в отдельный сервис без переписывания логики.
- **`auth.middleware.ts`** — единая точка проверки JWT и роли. Роуты вида `router.get('/admin/orders', requireRole('admin'), ...)` — декларативно и без дублирования проверок в каждом контроллере.
- **Telegram-бот** (`modules/telegram`) стартует вместе с сервером в `server.ts` (`bot.launch()` через polling — вебхук не нужен при таком масштабе). Бот вызывает те же сервисы (`orders.service`, `auth.service`), что и HTTP API, — никакой дублированной бизнес-логики.
- **Загрузка изображений**: клиент шлёт `multipart/form-data` на `/api/products/upload` → `upload.middleware.ts` (multer, память) → сервис стримит файлы в Cloudinary → возвращает массив URL → сохраняются в `Product.images`.

---

## 4. База данных

PostgreSQL + Prisma, схема — прямое отражение раздела 11 ТЗ:

```
User        1---N  Order        (по желанию — если понадобится привязка заказа к юзеру)
User        1---N  CartItem
Product     1---N  CartItem
Product     1---N  OrderItem
Order       1---N  OrderItem
```

- `CartItem` существует только для авторизованных пользователей (см. раздел 5 ТЗ) — гостевая корзина целиком живёт в `localStorage` фронтенда и на бэкенд не попадает до оформления заказа или логина.
- `Order`/`OrderItem` не требуют обязательной связи с `User` — заказ гостя создаётся без `userId`, что и требуется по ТЗ («регистрация не барьер для покупки»).
- Одна база, один `schema.prisma`, миграции через `prisma migrate` — отдельных баз для каждого модуля не нужно.

---

## 5. Взаимодействие частей — ключевые сценарии

**Гость оформляет заказ:**
`cart.store` (localStorage) → клик «Отправить заявку» → `POST /api/orders` (name, phone, comment, items) → бэкенд создаёт `Order` + `OrderItem[]` → `telegram.service` отправляет уведомление админу → фронт очищает `cart.store`.

**Логин с товарами в гостевой корзине:**
`POST /api/auth/login` → фронт получает access token + user → `lib/merge-cart.ts` отправляет текущий `localStorage`-список в `POST /api/cart/merge` → бэкенд объединяет с существующими `CartItem` пользователя → фронт заменяет `cart.store` данными с сервера.

**Восстановление пароля через Telegram:**
`/forgot-password` → `POST /api/auth/forgot-password` → если `telegramChatId` есть — `telegram.service` шлёт код через бота, код (с TTL 15 мин) хранится в таблице/кэше рядом с `User`; если нет — фронт показывает инструкцию по `/link email` → бот-обработчик команды сохраняет `chat_id`.

**Админ создаёт товар с фото:**
Форма в `/admin/products` → `multipart/form-data` на `POST /api/products` → `upload.middleware.ts` → Cloudinary → `products.service` сохраняет запись в БД с URL-ами изображений.

Во всех случаях фронтенд общается с бэкендом только через `lib/api.ts` — единый слой, который добавляет заголовок авторизации и прозрачно обновляет access token при 401 через refresh-cookie.

---

## 6. Деплой

Архитектура рассчитана на **два независимых деплой-юнита**, чтобы позже не пришлось ничего переписывать:

```
docker-compose.yml
├── frontend   # next build && next start (или статика, если понадобится)
├── backend    # node dist/server.js (Express + встроенный Telegram-бот)
├── postgres   # том для персистентности данных
└── nginx      # реверс-прокси: "/" -> frontend, "/api" -> backend, единый домен + TLS
```

- Все секреты (JWT-ключи, Cloudinary, Telegram bot token, `DATABASE_URL`) — только в `.env`, никогда в репозитории; `.env.example` фиксирует список нужных переменных.
- На старте достаточно одного VPS: `git pull && docker compose up -d --build`. CI/CD, кластеры и балансировщики на этом масштабе не нужны — их можно добавить позже, не меняя структуру кода.
- Если в будущем понадобится вынести фронтенд на Vercel, а бэкенд оставить на VPS — это делается без изменений в коде: просто разный `NEXT_PUBLIC_API_URL` и перенос `nginx`-прокси только под `/api`.
- Prisma-миграции (`prisma migrate deploy`) — часть шага деплоя бэкенда, выполняются перед стартом сервера.

---

## 7. Почему без усложнений

- Один бэкенд-процесс вместо auth-service/orders-service/bot-service — при текущей нагрузке (один магазин, ручные заявки) разделение только добавит сетевые вызовы и точки отказа.
- Zustand вместо Redux/Context-каши — состояния немного (корзина, юзер, UI-флаги drawer/modal), сторы получаются плоскими и читаемыми.
- Модули по доменам вместо слоёв (`controllers/`, `models/`, `views/` вперемешку по всему проекту) — при росте каталога (новая сущность вроде «Отзывы» или «Промокоды») просто добавляется папка `modules/reviews/`, ничего в существующих модулях не трогается.
- Docker Compose вместо Kubernetes/Terraform — деплой на один VPS одной командой, инфраструктурный код не разрастается сильнее самого приложения.
