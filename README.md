# TeleAgent landing

Лендинг TeleAgent с формой заявки и сохранением лидов в PostgreSQL.

## Быстрый старт

```bash
npm install
npm run dev
```

## Переменные окружения

Создайте `.env.local`:

```
DATABASE_URL=postgresql://user:password@host:port/db
```

## База данных (Railway Postgres)

1. Создайте Postgres в Railway.
2. Скопируйте `DATABASE_URL` из Railway и добавьте в Vercel.
3. Примените схему из `db/schema.sql`.

```sql
-- db/schema.sql
create extension if not exists "pgcrypto";
create table if not exists leads (...);
```

## Деплой

- **Vercel**: подключите репозиторий, установите `DATABASE_URL`.
- **Railway Web**: можно развернуть как Web Service, если хотите запускать Next.js там.
- **Railway Postgres**: используется для хранения лидов.

## API

- `POST /api/lead` — сохранить заявку.
- `GET /api/health` — health-check.

## Настройка домена

В `app/layout.tsx` поменяйте `metadataBase` на ваш домен.
