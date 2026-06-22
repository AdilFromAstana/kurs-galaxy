# Статус миграции на полноценный бэкенд

## Как запустить

```bash
docker compose up -d --build
docker compose logs -f app
# → http://localhost:3000
```

Дефолтный админ: `admin@nailacademy.com / admin123` (меняется в `.env`).

### Команды
```bash
npm run docker:up        # поднять
npm run docker:down      # остановить
npm run docker:logs      # логи app
npm run docker:reset     # сбросить БД (удаляет volume!)
docker compose exec db psql -U nail nail_academy
docker compose exec app npx prisma studio  # GUI БД
docker compose exec app npx prisma db push # применить изменения схемы
```

### Порты
- App: **3000**
- Postgres: **5434** (хост) → 5432 (контейнер). Не конфликтует с `viralwall_db_dev` :5433.

---

## Что сделано

### Бэкенд
- Postgres 16-alpine в контейнере, volume `nail_db_data`.
- Dockerfile + entrypoint: ждёт БД → `prisma db push` → seed → `next dev`.
- Prisma schema: `User`, `Admin`, `Course`, `Module`, `Lesson`, `Material`, `PricingPlan`, `Purchase`, `Progress`, `VideoPosition`, `LastLesson`.
- Сид: дефолтный админ + перенос `coursesData` в БД.
- Подписанные cookie-сессии (HMAC-SHA256, Web Crypto, 7 дней) — работают и в Edge, и на сервере.
- bcrypt-хеши паролей.
- Server Actions auth (студент: register/login/logout, админ: login/logout).
- Middleware защищает `/admin/*`, `/dashboard`, `/profile`, `/lesson`, `/course`, `/courses`.

### HTTP API
| Метод | Путь | Что делает |
|---|---|---|
| POST | `/api/auth/register` | Регистрация студента |
| POST | `/api/auth/login` | Логин студента |
| POST | `/api/auth/logout` | Выход студента |
| GET | `/api/me` | Текущий студент + покупки + прогресс + lastLesson |
| GET | `/api/courses` | Каталог |
| GET | `/api/courses/[id]` | Курс по id или slug |
| GET/POST | `/api/purchases` | История / купить (мок-оплата) |
| GET/POST | `/api/progress` | Получить / отметить урок пройденным |
| POST | `/api/last-lesson` | Запомнить последний открытый урок |
| GET/POST | `/api/video-position` | Прочитать / сохранить позицию видео |
| GET/POST | `/api/admin/courses` | Список / создать курс (только админ) |

### Фронт переведён на API (LocalStorage больше не используется студенческим UI)
- React-контексты `SessionProvider` и `CoursesProvider` ([components/providers/](components/providers/)) — единое место загрузки `/api/me` и `/api/courses`.
- Хуки `useAuth`, `useProgress`, `usePurchase` теперь тонкие обёртки над контекстом → реально читают/пишут БД через API.
- Страницы:
  - [app/page.tsx](app/page.tsx) — каталог из API
  - [app/auth/login/page.tsx](app/auth/login/page.tsx), [app/auth/register/page.tsx](app/auth/register/page.tsx) — POST в `/api/auth/*`
  - [app/dashboard/page.tsx](app/dashboard/page.tsx) — курсы и покупки из API
  - [app/courses/page.tsx](app/courses/page.tsx)
  - [app/course/[courseId]/page.tsx](app/course/[courseId]/page.tsx)
  - [app/lesson/[lessonId]/page.tsx](app/lesson/[lessonId]/page.tsx) — прогресс/lastLesson через API
  - [app/profile/page.tsx](app/profile/page.tsx)
- Компоненты: [VideoPlayer](components/lesson/VideoPlayer.tsx) (debounced POST `/api/video-position`), [PurchaseModal](components/modals/PurchaseModal.tsx), [ContinueButton](components/dashboard/ContinueButton.tsx), [ModuleList](components/dashboard/ModuleList.tsx) — всё через контексты.
- Логин админа уже идёт в БД через bcrypt (cookie-сессия).

### Проверки
- `npx tsc --noEmit` — чисто (0 ошибок).

### E2E-тесты (Playwright)
Файлы: [tests/e2e/](tests/e2e/), конфиг [playwright.config.ts](playwright.config.ts).

Покрывают весь основной флоу:
- `01-auth.spec.ts` — лендинг, регистрация, дубликат email, неверный пароль, логин-после-регистрации, защита `/dashboard`.
- `02-catalog-purchase.spec.ts` — каталог из БД, страница курса, покупка тарифа, доступ к бесплатным/заблокированным урокам.
- `03-progress-certificate.spec.ts` — отметка пройденного урока, сохранение позиции видео, 100% курс → сертификат.
- `04-admin.spec.ts` — защита `/admin`, логин дефолтного админа, `/api/admin/courses`.

#### Запуск
```bash
# 1. Поднять приложение (если ещё не):
docker compose up -d --build

# 2. Один раз — поставить браузер:
npm run test:e2e:install

# 3. Запустить тесты:
npm run test:e2e          # headless
npm run test:e2e:headed   # с окном браузера
npm run test:e2e:ui       # интерактивный UI

# Отчёт после прогона:
npx playwright show-report
```

Тесты создают уникальных пользователей при каждом запуске (`pw-<timestamp>@test.local`), так что БД сбрасывать не нужно. Если надо начать с нуля: `npm run docker:reset`.

`PLAYWRIGHT_BASE_URL` можно переопределить (по умолчанию `http://localhost:3000`).


---

## Что НЕ доделано

### 🟡 Админка (ещё пишет в LocalStorage и в захардкоженный `coursesData`)
Все эти страницы остаются на LS-варианте, потому что для них нет CRUD-эндпоинтов:

- [app/admin/page.tsx](app/admin/page.tsx) — статистика из `coursesData`
- [app/admin/courses/page.tsx](app/admin/courses/page.tsx) — список курсов
- [app/admin/courses/[courseId]/page.tsx](app/admin/courses/[courseId]/page.tsx)
- [app/admin/courses/[courseId]/edit/page.tsx](app/admin/courses/[courseId]/edit/page.tsx)
- [app/admin/courses/[courseId]/pricing/...](app/admin/courses/[courseId]/pricing/) — тарифы пишутся в LS-ключ `nail_pricing_<courseId>`
- [app/admin/lessons/create/page.tsx](app/admin/lessons/create/page.tsx), [app/admin/lessons/[lessonId]/edit/page.tsx](app/admin/lessons/[lessonId]/edit/page.tsx)
- [app/admin/modules/create/page.tsx](app/admin/modules/create/page.tsx), [app/admin/modules/[moduleId]/edit/page.tsx](app/admin/modules/[moduleId]/edit/page.tsx)
- [app/admin/students/page.tsx](app/admin/students/page.tsx) — заглушка
- [app/admin/settings/page.tsx](app/admin/settings/page.tsx)
- [hooks/useAdminAuth.ts](hooks/useAdminAuth.ts), [lib/adminAuth.ts](lib/adminAuth.ts) — клиентский LS-логин, не нужен (есть серверный)

**Что нужно добавить, чтобы доделать админку:**
1. Эндпоинты:
   - `PATCH/DELETE /api/admin/courses/[id]`
   - `POST/PATCH/DELETE /api/admin/modules` (+ `/[id]`)
   - `POST/PATCH/DELETE /api/admin/lessons` (+ `/[id]`, материалы)
   - `POST/PATCH/DELETE /api/admin/pricing` (+ `/[id]`)
   - `POST /api/admin/reorder` для @dnd-kit (модули и уроки)
   - `GET /api/admin/students` (список студентов из `prisma.user.findMany`)
   - `GET /api/admin/me` (текущий админ для UI)
2. Заменить вызовы `coursesData`/`localStorage` в админ-страницах на `fetch('/api/admin/...')`.
3. Удалить [hooks/useAdminAuth.ts](hooks/useAdminAuth.ts) и [lib/adminAuth.ts](lib/adminAuth.ts).

### 🟢 Доработки/полировка
- Реальная оплата (Kaspi/CloudPayments + webhook на `/api/payments/webhook`) — сейчас покупка мокается в `/api/purchases` POST.
- Загрузка видео в S3/MinIO (есть существующие minio-volumes у других проектов).
- Email-верификация регистрации, восстановление пароля.
- Удалить [lib/storage.ts](lib/storage.ts) — больше не используется студенческим UI.
- [lib/courseData.ts](lib/courseData.ts) оставлен только как источник для сида; после полной админки можно удалить.
- Rate limiting на `/api/auth/*`.
- Production Dockerfile (multi-stage с `next build` + `next start`).
- Тесты (vitest + supertest для API).
- Sentry/логирование.

---

## Архитектура (текущая)

```
Browser
   │  cookies (httpOnly, HMAC):
   │   nail_user_session  — для студента
   │   nail_admin_session — для админа
   ▼
Next.js (контейнер `app`, порт 3000)
   ├── Middleware (Edge)        проверяет подпись cookie, редиректы
   ├── App Router pages         клиентские — читают данные из контекстов
   │   └── SessionProvider      ← /api/me
   │       CoursesProvider      ← /api/courses
   ├── Server Actions           формы логина админа
   ├── Route Handlers /api/*    бизнес-логика, идёт в Prisma
   └── Prisma Client
       ▼
Postgres (контейнер `db`, volume nail_db_data, порт 5434)
```

## Что работает сейчас (студенческий UX)
1. Регистрация на `/auth/register` — пишет в БД, выдаёт cookie-сессию.
2. Логин на `/auth/login` — bcrypt verify, cookie.
3. Каталог `/courses`, `/dashboard` — читают из БД через `/api/courses`.
4. Покупка тарифа — `/api/purchases` POST, запись в `Purchase` с расчётом `expiresAt`.
5. Прохождение урока — позиция видео, прогресс, последний урок — всё в БД.
6. Сертификат на `/profile` — открывается при 100% прогресса по курсу.
7. Админ: логин на `/admin/login` идёт в БД (bcrypt). Дальнейшие админ-страницы пока работают по старому (см. список выше).

## Следующий шаг (рекомендация)
Добавить CRUD-эндпоинты админки и переключить `app/admin/courses/...` на API — после этого можно полностью удалить `lib/storage.ts`, `lib/courseData.ts` и считать миграцию завершённой.
