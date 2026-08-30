# Reader API

Bun + Elysia + Prisma + PostgreSQL. Хранилище файлов — локальная папка или Supabase Storage.

## Запуск

```bash
cp .env.example .env      # и поправить JWT_SECRET
docker compose up -d      # postgres на localhost:5434
bun install
bunx prisma migrate deploy
bunx prisma generate
bun dev                   # http://localhost:3000
```

Swagger — <http://localhost:3000/swagger>.

## Хранилище

`STORAGE_DRIVER=local` (по умолчанию) складывает `.epub` и обложки в `BE/storage/`
и раздаёт их роутом `/files/*`: обложки открыто, книги — только по подписанной ссылке
из `GET /book/:id/read` (живёт час).

`STORAGE_DRIVER=supabase` требует `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_BUCKET`.

## Эндпоинты

| Метод | Путь | Что делает |
|---|---|---|
| POST | `/auth/register` · `/auth/login` | регистрация и вход, отдают JWT на 7 дней |
| GET | `/auth/me` | текущий пользователь |
| POST | `/auth/logout` | выход |
| POST | `/book/upload` | загрузить `.epub` (+ обложка, жанры, public/private) |
| POST | `/book/add` | добавить книгу из каталога к себе |
| GET | `/book/private` | мои книги: поиск, фильтры, сортировка, избранное |
| GET | `/book/catalog` | публичные книги, которых у меня ещё нет |
| GET | `/book/catalog/sections` | каталог секциями: Most popular + жанры |
| GET | `/book/genres` | жанры для фильтров (`?scope=library\|catalog`) |
| GET | `/book/:id` | карточка книги + в каких она коллекциях |
| GET | `/book/:id/read` | подписанная ссылка на файл и позиция чтения |
| PATCH | `/book/:id` | название, обложка, public/private |
| PATCH | `/book/:id/settings` | позиция, прогресс, тема, размер шрифта |
| PATCH | `/book/:id/favourite` | избранное |
| DELETE | `/book/:id` | убрать из библиотеки |
| GET/POST | `/collection` | список и создание коллекций |
| GET/PATCH/DELETE | `/collection/:id` | коллекция целиком |
| POST | `/collection/:id/books` | добавить книгу в коллекцию |
| DELETE | `/collection/:id/books/:bookId` | убрать книгу из коллекции |

Ошибки приходят как `{ "status": "error", "message": "…" }` с честным HTTP-кодом
(401 / 403 / 404 / 409 / 422 / 500).
