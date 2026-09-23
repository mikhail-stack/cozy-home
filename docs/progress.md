# Прогресс — Cozy Home

Статус выполнения задач из [plan.md](plan.md). Отмечать `[x]` по мере завершения, при значимых изменениях добавлять запись в журнал внизу.

## Frontend

- [x] Базовые UI-компоненты и токены дизайн-системы
- [x] Layout: Header, Footer, корневой layout
- [x] Zustand-сторы: cart, ui, auth
- [x] Главная `/`: Hero, фильтр категорий, сетка товаров
- [ ] Виджет корзины (drawer)
- [ ] Модалка оформления заказа
- [ ] Страница товара `/products/:id`
- [ ] Страница «О магазине» `/about`
- [ ] Авторизация: `/login`, `/register`, `/forgot-password`, `/reset-password`
- [ ] Личный кабинет `/profile`
- [ ] Админ-панель `/admin`
- [ ] `lib/api.ts` + `middleware.ts`
- [ ] Перенос гостевой корзины в аккаунт после логина

## Backend и база данных

- [ ] `schema.prisma` + первая миграция
- [ ] Auth-модуль (JWT, роли)
- [ ] Products-модуль (CRUD, Cloudinary)
- [ ] Cart-модуль (серверная корзина, merge)
- [ ] Orders-модуль (заказы, статусы, фильтры)
- [ ] About-модуль
- [ ] Users-модуль (админка)
- [ ] Telegram-бот (уведомления, `/link`)
- [ ] Восстановление пароля (код, TTL 15 мин)
- [ ] Интеграция фронта с реальным API, прогон сценариев из ТЗ
- [ ] Развёртывание (docker-compose, миграции на сервере)

## Журнал

<!-- Формат записи:
### YYYY-MM-DD
- Что сделано
- Что решили / на что обратить внимание дальше
-->

### 2026-09-23
- Подготовлена структура проекта (frontend/backend), зависимости, база конфигов, `docker-compose.yml`
- Добавлены `docs/architecture.md`, `docs/DESIGN.md`, `CLAUDE.md`, `docs/plan.md`
- Дизайн-токены из DESIGN.md подключены в `frontend/app/globals.css`
- Инициализирован git-репозиторий, сделан первый коммит
- Пункт плана 1: подключён шрифт (Inter вместо GP, `frontend/lib/fonts.ts`), базовые стили `body`, компоненты `Button`, `Input`, `Modal` в `frontend/components/ui/`
- Пункт плана 2: `Header`/`Footer` (`frontend/components/layout/`) и корневой `app/layout.tsx`; поправлен `eslint.config.mjs` под flat-config Next.js 16 (`eslint-config-next/core-web-vitals` + `/typescript` вместо устаревшего `FlatCompat`); `npm install`, `npm run lint` и `npm run build` в `frontend/` проходят чисто
- Пункт плана 3: Zustand-сторы `cart.store` (persist в localStorage), `ui.store` (флаг drawer корзины), `auth.store` (пользователь/токен только в памяти) в `frontend/store/`
- Пункт плана 4: главная страница (`app/page.tsx`) — Hero без фото (нет реальной съёмки, решили не подставлять заглушку-картинку), фильтр категорий текстовыми ссылками вместо круглых "таблеток" из ТЗ (в DESIGN.md радиус запрещён везде кроме инпутов), сетка товаров 2/3/5 колонок с hairline-границами; карточка использует "The Letter System" из DESIGN.md вместо фото товара (реальные фото — после Cloudinary, backend); `Header` подключён к `cart.store`/`ui.store` — счётчик и добавление в корзину реально работают, проверено в браузере (chrome-devtools): фильтрация и добавление товара обновляют счётчик
