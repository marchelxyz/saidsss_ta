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

## Деплой на Railway (Web + Postgres)

1. Создайте проект и сервис **Postgres** в Railway.
2. Создайте сервис **Web** (Next.js) в Railway.
3. В сервисе **Web** добавьте переменную `DATABASE_URL` из Postgres.
4. Примените схему из `db/schema.sql`.

```sql
-- db/schema.sql
create extension if not exists "pgcrypto";
create table if not exists leads (...);
```

## Деплой

- **Railway Web**: подключите репозиторий и задайте `DATABASE_URL`.
- **Railway Postgres**: используется для хранения лидов.

## API

- `POST /api/lead` — сохранить заявку.
- `GET /api/health` — health-check.

## Настройка домена

В `app/layout.tsx` поменяйте `metadataBase` на ваш домен.
