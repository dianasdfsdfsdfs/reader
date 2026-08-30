# Reader — план доработки проекта

Монорепозиторий `reader/`: `BE/` (Bun + Elysia + Prisma + Supabase) и новый `FE/` (Vite + React).

---

## 0. Что уже есть в BE

| Слой | Состояние |
|---|---|
| Prisma schema | `User`, `Book`, `UsersBooks`, `Genre`, `GenresBooks`, enum `Visibility`, `Themes` |
| auth | register / login — работают; middleware `authentificate` (Bearer JWT) |
| book | upload / add / private / catalog / :id/read / PATCH :id — работают |
| book | `PATCH :id/settings`, `PATCH :id/favourite`, `DELETE :id` — **пустые заглушки** |
| storage | Supabase bucket, signed URL на 1 час |
| infra | docker-compose (postgres:16 на порту 5434), 6 миграций |

**Чего нет вообще:** коллекций, CORS, единой обработки ошибок, `GET /auth/me`, фронтенда.

---

## 1. Бэкенд — доработка

### 1.1 Схема БД — коллекции (новая миграция `add_collections`)

```prisma
model Collection {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  userId      Int
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  books       CollectionsBooks[]
  createdAt   DateTime @default(now())
  @@unique([userId, name])
}

model CollectionsBooks {
  @@id([collectionId, bookId])
  collectionId Int
  collection   Collection @relation(...)
  userId       Int
  bookId       Int
  userBook     UsersBooks @relation(fields: [userId, bookId], references: [userId, bookId], onDelete: Cascade)
  addedAt      DateTime   @default(now())
}
```

Связь идёт на `UsersBooks`, а не на `Book` — тогда в коллекцию физически нельзя положить
чужую книгу, а удаление книги из библиотеки автоматически убирает её из всех коллекций.

### 1.2 Эндпоинты

**`/auth`**
- `POST /register`, `POST /login` — есть, добавить корректные HTTP-статусы
- `GET /me` — **новый** (защищённый)
- `POST /logout` — **новый**

**`/book`**
- `POST /upload`, `POST /add`, `GET /private`, `GET /catalog`, `GET /:id/read`, `PATCH /:id` — есть
- `GET /genres` — **новый** (список жанров для фильтров)
- `GET /:id` — **новый** (карточка книги)
- `PATCH /:id/settings` — **дописать** (progress, currentLocation, theme, fontSize)
- `PATCH /:id/favourite` — **дописать**
- `DELETE /:id` — **дописать** (сервис `deleteBook` уже готов, роут пустой)

**`/collection`** — модуль целиком новый
- `GET /` — мои коллекции + количество книг + обложки для превью
- `POST /` — создать
- `GET /:id` — коллекция и её книги
- `PATCH /:id` — переименовать / описание
- `DELETE /:id`
- `POST /:id/books` — добавить книгу
- `DELETE /:id/books/:bookId` — убрать книгу

### 1.3 Сквозные правки
- `@elysiajs/cors` — без него фронт не сможет ходить в API
- Класс `AppError` + глобальный `.onError` → 401 / 403 / 404 / 409 / 422 вместо нынешних
  `try/catch` с `{status:"error"}` и HTTP 200 (сейчас фронт не отличит ошибку от успеха)
- `@elysiajs/swagger` на `/swagger`
- **Баг:** в `registerBody` пароль до 10 символов, в `loginBody` — до 8. Пароль из 9–10
  символов регистрируется, но залогиниться им нельзя. Поднять оба до 128.
- `.env.example`

---

## 1.5 Что на вайрфреймах (источник истины по UI)

Кадры нарисованы вертикальными, телефонными, с нижним таб-баром → **делаем mobile-first,
на десктопе таб-бар превращается в левый сайдбар**.

**Важно:** названия на вайрфреймах не совпадают с бэкендом —
`Home` = мои книги (`/book/private`), `Library` = публичный каталог (`/book/catalog`).
В UI держим формулировки с вайрфреймов.

### Экран «Home»
- Поиск: «Search a book from your uploads»
- Два таба: **All books** | **Collections**
- *All books* — карточки книг: обложка, название, `13%` прогресс, бейдж Public/Privat, меню «…»
- *Collections* — вертикальный список коллекций («English · 13 books», «Russian»),
  внутри каждой обложки едут **горизонтально** (прямая цитата из заметки на полях)
- Снизу таб-бар

### Меню книги «…»
`Change cover` · `Change name` · `Add to collection` · `Make public / privat`
(+ `Delete` — на вайрфрейме нет, но нужен, раз есть `DELETE /book/:id`)

### Экран «Upload» — два шага
1. Большая зона «**Upload a book in .epub**»
2. Форма метаданных: ⊗ отмена слева / ✓ подтвердить справа, превью «Name by Author»,
   и действия `change name`, `change cover`, `set language`, `set genre`, `set author`,
   переключатель `privat ⟷ public`

### Экран «Library» (публичный каталог)
- Поиск: «Search a book in the library»
- Секции строками: **Most popular**, затем по жанрам (Detectives, Romantic, Thrillers…)
- Каждая секция — горизонтальный скролл обложек

### Следствия для бэкенда
- `catalogBooksQuery` не умеет искать по названию → добавить фильтр `title`
- Нужен `GET /book/catalog/sections` — «Most popular» + секции по жанрам одним запросом,
  иначе фронт делает N+1 обращений на каждый жанр

---

## 2. Фронтенд — `FE/`

### 2.1 Стек
Vite + React 19 + TypeScript · React Router · TanStack Query · Tailwind CSS v4 ·
`epubjs` (чтение) · `lucide-react` (иконки)

### 2.2 Структура
```
FE/src/
├── shared/{api,types,hooks,ui}
├── features/
│   ├── auth/        AuthProvider, Login, Register, ProtectedRoute
│   ├── library/     LibraryPage, BookCard, Filters
│   ├── catalog/     CatalogPage
│   ├── collections/ CollectionsPage, CollectionPage
│   ├── book/        BookDetailPage, UploadModal, EditModal
│   └── reader/      ReaderPage (epub.js), TocDrawer, SettingsPanel
└── layouts/         AppLayout (сайдбар + топбар)
```

### 2.3 Экраны
1. **Вход / Регистрация** — на вайрфреймах нет, но бэкенд требует
2. **Home** — табы All books / Collections, поиск, меню «…» у каждой книги
3. **Upload** — шаг 1 (файл) → шаг 2 (метаданные + private/public)
4. **Library** — каталог секциями: Most popular + жанры, горизонтальный скролл
5. **Коллекция** — книги внутри
6. **Читалка** — epub.js, оглавление, темы, размер шрифта, автосохранение позиции
7. **Профиль** — email, выход

### 2.4 Палитра «Spring Green Harmony»
```
--brand-900 #35795F   тёмно-зелёный — сайдбар, шапки
--brand-800 #4E9A55
--brand-700 #66AC3C
--brand-600 #7DB637   основные кнопки
--brand-500 #A8CB33
--brand-400 #BCD42F
--brand-300 #CFDF2C
--brand-200 #DFE83A
--brand-100 #F0F35C
--brand-50  #FBFB40   жёлтый — акценты, подсветка
```

### 2.5 Загрузка EPUB
Метаданные (название, автор, язык) и обложку тянем из файла на клиенте через `epubjs`,
подставляем в форму загрузки — бэкенд трогать не нужно, а UX лучше.

---

## 3. Проверка
1. `docker compose up -d` → postgres
2. `bunx prisma migrate dev` → новая миграция
3. BE на `:3000`, FE на `:5173`
4. Сквозной прогон в браузере: регистрация → загрузка epub → библиотека → коллекция → чтение

## 4. Git
Корневой `README.md`, `.gitignore` для FE, отдельные коммиты на BE и FE, push в `master`.
