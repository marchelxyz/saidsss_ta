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
ADMIN_PASSWORD=your-strong-password
ADMIN_TOKEN=your-random-token
AI_API_KEY=your-ai-key
AI_API_BASE=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
IMAGE_PROVIDER=gemini
IMAGE_API_KEY=your-image-key
IMAGE_API_BASE=https://generativelanguage.googleapis.com/v1beta
IMAGE_MODEL=models/gemini-3-pro-image-preview
S3_ENDPOINT=https://storage.yandexcloud.net
S3_REGION=ru-central1
S3_BUCKET=your-bucket
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_PUBLIC_BASE_URL=https://storage.yandexcloud.net/your-bucket
RUN_MIGRATIONS=true
```

### Зачем эти переменные

- `ADMIN_PASSWORD` — пароль для входа в админку. Вводится в поле «Ваше имя» любой формы заявки.
- `ADMIN_TOKEN` — токен для cookie-сессии админки. Можно задать любой длинный секрет.
- `AI_API_KEY` — ключ для AI-анализа лидов и AI-помощника статей.
- `AI_API_BASE` и `AI_MODEL` — позволяют использовать другой OpenAI‑совместимый провайдер/модель (по умолчанию `gpt-4o-mini`).
- `IMAGE_PROVIDER`, `IMAGE_API_KEY`, `IMAGE_API_BASE`, `IMAGE_MODEL` — генерация изображений (Gemini/OpenAI).
- `S3_*` — хранилище изображений (Yandex Object Storage, S3‑совместимое).

## Деплой на Railway (Web + Postgres)

1. Создайте проект и сервис **Postgres** в Railway.
2. Создайте сервис **Web** (Next.js) в Railway.
3. В сервисе **Web** добавьте переменную `DATABASE_URL` из Postgres.
4. Примените схему из `db/schema.sql` (есть таблицы лидов, статей, кейсов и настроек).

```sql
-- db/schema.sql
create extension if not exists "pgcrypto";
create table if not exists leads (...);
```

## Деплой

- **Railway Web**: подключите репозиторий и задайте `DATABASE_URL`.
- **Railway Postgres**: используется для хранения лидов.

## Автоматическое создание таблиц

Если хотите автоприменение `db/schema.sql` при старте, установите `RUN_MIGRATIONS=true`.
Скрипт запускается в `prestart` и безопасен для повторного запуска.

## API

- `POST /api/lead` — сохранить заявку.
- `GET /api/health` — health-check.
- `POST /api/admin/login` — вход в админку.
- `DELETE /api/admin/login` — выход.

## Админка

- URL: `/admin`
- Вход через любую форму заявки: в поле "Ваше имя" введите `ADMIN_PASSWORD`.
- После успешного входа ставится cookie `admin_session`, далее открывается `/admin`.

## Настройка домена

В `app/layout.tsx` поменяйте `metadataBase` на ваш домен.
