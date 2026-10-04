FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 4000
# Миграции — часть шага деплоя (docs/architecture.md, раздел 6): прогоняются
# при каждом старте контейнера, перед запуском сервера. `migrate deploy`
# идемпотентен — применяет только ещё не применённые миграции, повторный
# прогон на уже актуальной базе ничего не делает.
CMD ["sh", "-c", "npm run prisma:deploy && npm run start"]
