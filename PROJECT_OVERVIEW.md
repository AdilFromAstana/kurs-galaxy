# KursGalaxy.kz (nail-academy-pro) — обзор проекта

## Что это
LMS (Learning Management System) для онлайн-курсов beauty-индустрии: изначально маникюр, фактически в данных лежит курс **Brow Master Pro** (бровист). Прототип/MVP без бэкенда — всё хранится в браузере.

## Стек
Next.js 14 (App Router) · TypeScript · Tailwind · React 18 · lucide-react · react-hook-form · @dnd-kit (drag-n-drop модулей/уроков в админке) · bcryptjs (только в зависимостях, реально для админ-паролей используется `btoa`).

## Для кого
- **Студенты** — покупают курс по тарифу и проходят уроки.
- **Администратор/преподаватель** — управляет каталогом курсов, модулей, уроков и тарифов через `/admin`.

## Зачем
Дать платформу «под ключ» для продажи и прохождения видеокурсов: регистрация → каталог → покупка тарифа → видеоуроки с прогрессом → сертификат.

---

## Структура

| Папка | Назначение |
|---|---|
| [app/](app/) | Маршруты Next.js (App Router) |
| [app/auth/](app/auth/) | Регистрация / вход студента |
| [app/dashboard/](app/dashboard/) | «Мои курсы» |
| [app/courses/](app/courses/) · [app/course/[courseId]/](app/course/) | Каталог и страница курса |
| [app/lesson/[lessonId]/](app/lesson/) | Страница урока + видеоплеер |
| [app/profile/](app/profile/) | Профиль и сертификат |
| [app/admin/](app/admin/) | Админка: courses, modules, lessons, students, settings, pricing |
| [components/](components/) | UI: layout, dashboard, lesson, modals, admin (+dnd) |
| [hooks/](hooks/) | `useAuth`, `useProgress`, `usePurchase`, `useAdminAuth` |
| [lib/storage.ts](lib/storage.ts) | LocalStorage helpers (покупки, прогресс, last-lesson, видеотайм) |
| [lib/courseData.ts](lib/courseData.ts) | Хардкод курсов (`brow-master-pro`, ~10 уроков) |
| [lib/pricing.ts](lib/pricing.ts) | Периоды доступа и работа с тарифами в LS |
| [lib/adminAuth.ts](lib/adminAuth.ts) | Клиентская админ-авторизация (LS, `btoa`) |
| [lib/auth/actions.ts](lib/auth/actions.ts) | Server Actions: cookie-сессия админа |
| [middleware.ts](middleware.ts) | Защита `/admin/*` по cookie `nail_admin_session` |
| [types/](types/) | `index.ts` (домен), `admin.ts` (админ) |

## Что приложение умеет (фичи)

### Студент
- Регистрация и вход (данные в LocalStorage, `nail_user`).
- Каталог курсов, страница курса с тарифами.
- Покупка тарифа (имитация оплаты): `1m / 2m / 3m / 6m / 12m / unlimited`, дата истечения считается локально.
- Видеоплеер: контроль скорости (0.5x–2x), сохранение позиции (`nail_lesson_<id>_time`).
- Прогресс по урокам и модулям, «продолжить с того места».
- Бесплатные уроки доступны без покупки (`isFree: true`).
- Сертификат при 100% прохождения.

### Админ (`/admin`)
- Логин (`admin@nailacademy.com / admin123`), сессия в httpOnly cookie через Server Action.
- CRUD курсов, модулей, уроков; перетаскивание порядка через @dnd-kit.
- CRUD тарифных планов курса (`/admin/courses/[id]/pricing`).
- Раздел студентов и настроек (заглушки/каркас).
- Мобильная админка: `MobileSidebar`, `MobileBottomNav`, `MobileHeader`.

## Хранение данных (LocalStorage)
| Ключ | Назначение |
|---|---|
| `nail_user` | Текущий пользователь |
| `nail_purchases` | Объект `{ [courseId]: PurchaseData }` |
| `nail_purchased` | **Устарел**, мигрируется в `nail_purchases` |
| `nail_progress` | `{ [courseId]: string[] }` пройденных уроков |
| `nail_last_lesson` | `{ [courseId]: lessonId }` |
| `nail_lesson_<id>_time` | Позиция видео |
| `nail_pricing_<courseId>` | Перезапись тарифов админкой |
| `nail_admin_users`, `nail_admin_session` | Админы и их сессия (LS-вариант) |
| cookie `nail_admin_session` | Серверная сессия админа (24ч) |

## Что **можно** делать
- Запускать локально (`npm run dev`), деплоить на Vercel — **как демо/прототип**.
- Демонстрировать UX курса, прогресс, тарифы, админку — заказчику/инвестору.
- Расширять контент через хардкод в [lib/courseData.ts](lib/courseData.ts) или через админку (изменения остаются в LS текущего браузера).
- Использовать как стартовый каркас под реальный бэкенд.

## Что **нельзя** делать (важные ограничения)
- **Нельзя продавать как продакшн-LMS.** Нет настоящего бэкенда: пользователи, покупки и прогресс живут только в браузере и стираются при очистке кеша.
- **Покупка не защищена.** Достаточно открыть DevTools и записать `nail_purchases` — весь курс открывается без оплаты. Реальная интеграция платёжки отсутствует.
- **Пароли студентов хранятся в открытом виде в LocalStorage.** Никакого хеширования на клиенте смысла не имеет.
- **Админ-пароли «хешируются» через `btoa`** ([lib/adminAuth.ts:14](lib/adminAuth.ts#L14), [lib/auth/actions.ts:18](lib/auth/actions.ts#L18)) — это base64, не хеш. Дефолтный пароль `admin123` зашит в коде.
- **Сессия в cookie — это plain JSON без подписи** ([lib/auth/actions.ts:50](lib/auth/actions.ts#L50)). Подделывается тривиально, middleware верит содержимому.
- **Нет multi-tenant и нет реальной БД** — нельзя одновременно вести нескольких студентов с одного устройства/синхронизировать между устройствами.
- **Нет email/верификации/восстановления пароля.**
- **Нет загрузки видео** — только внешние URL (в демо-данных это публичные sample-видео Google).
- **Каталог курсов — хардкод** в [lib/courseData.ts](lib/courseData.ts). Создание курса в админке кладёт данные только в LocalStorage текущего браузера — другие пользователи этого не увидят.

## Куда расти (если делать продукт)
1. Бэкенд (Next API routes / отдельный сервис) + БД (Postgres) для users, courses, modules, lessons, pricing_plans, purchases, progress.
2. Реальная аутентификация (NextAuth / собственная) с bcrypt и подписанной сессией.
3. Интеграция платежей (Kaspi/Stripe/CloudPayments) с вебхуками — статус покупки только с сервера.
4. Хранилище видео (S3 / Mux / Vimeo) и защищённые ссылки.
5. Server-side проверка доступа к урокам, а не клиентская.
6. Email/SMS, восстановление пароля, чек/договор оферты.
7. Аналитика прохождения, выгрузка, роли (admin/teacher/student).

## Точки входа в код
- Главная и редирект авторизованного: [app/page.tsx](app/page.tsx)
- Дашборд студента: [app/dashboard/page.tsx](app/dashboard/page.tsx)
- Урок: [app/lesson/[lessonId]/page.tsx](app/lesson/[lessonId]/page.tsx)
- Админ-логин (Server Action): [lib/auth/actions.ts](lib/auth/actions.ts) + [app/admin/login/page.tsx](app/admin/login/page.tsx)
- Защита админки: [middleware.ts](middleware.ts)
- Логика покупки: [hooks/usePurchase.ts](hooks/usePurchase.ts) + [lib/storage.ts](lib/storage.ts)
- Данные курса: [lib/courseData.ts](lib/courseData.ts)

**TL;DR:** работающий демо-LMS на фронтенде без бэкенда. Хорош как прототип/витрина, не годится как боевая платная платформа без переписывания слоя данных и авторизации.
