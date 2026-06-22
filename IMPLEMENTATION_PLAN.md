# План реализации (на основе существующего фронта)

## Фаза 1 — Admin API (бэк под уже существующие страницы)

| Endpoint | Метод | Под какую страницу |
|---|---|---|
| `/api/admin/me` | GET | greeting + проверка роли |
| `/api/admin/stats` | GET | `/admin` дашборд (число курсов/студентов) |
| `/api/admin/courses` | POST | `/admin/courses/create` |
| `/api/admin/courses/[id]` | GET, PATCH, DELETE | `/admin/courses/[courseId]`, `.../edit` |
| `/api/admin/courses/[id]/modules` | POST | `/admin/modules/create?courseId=...` |
| `/api/admin/modules/[id]` | PATCH, DELETE | `/admin/modules/[moduleId]/edit` |
| `/api/admin/modules/[id]/lessons` | POST | `/admin/lessons/create?moduleId=...` |
| `/api/admin/lessons/[id]` | PATCH, DELETE | `/admin/lessons/[lessonId]/edit` |
| `/api/admin/lessons/[id]/materials` | POST | редактор урока |
| `/api/admin/materials/[id]` | DELETE | редактор урока |
| `/api/admin/courses/[id]/pricing` | POST | `/admin/courses/[courseId]/pricing/create` |
| `/api/admin/pricing/[id]` | PATCH, DELETE | `/admin/courses/[courseId]/pricing/[planId]/edit` |
| `/api/admin/reorder/modules` | POST | DnD `SortableModuleList` |
| `/api/admin/reorder/lessons` | POST | DnD внутри модуля |
| `/api/admin/students` | GET | `/admin/students` |
| Helper `lib/auth/guard.ts` `requireAdmin()` | — | защита всех `/api/admin/*` |

## Фаза 2 — Подключение UI к API

Каждую страницу:
1. убрать импорт `coursesData` / `localStorage`
2. заменить на `fetch('/api/admin/...')` в `useEffect` для загрузки + onSubmit/onDelete для записи
3. оставить тот же визуальный поток

| Страница | Действия |
|---|---|
| `/admin/courses` | GET list, DELETE row |
| `/admin/courses/create` | POST → редирект |
| `/admin/courses/[id]` | GET курс с модулями/тарифами |
| `/admin/courses/[id]/edit` | GET → PATCH → DELETE |
| `/admin/courses/[id]/pricing` | GET тарифы курса |
| `/admin/courses/[id]/pricing/create` | POST |
| `/admin/courses/[id]/pricing/[planId]/edit` | GET → PATCH → DELETE |
| `/admin/modules/create` | POST + редирект на курс |
| `/admin/modules/[id]/edit` | GET → PATCH → DELETE |
| `/admin/lessons/create` | POST + редирект |
| `/admin/lessons/[id]/edit` | GET → PATCH → DELETE |
| `/admin/students` | GET list, удалить «LS» баннер |
| `/admin/settings` | заменить «очистить LS» на «выйти» |
| `/admin` | подключить `/api/admin/stats` |
| Sidebar `MobileSidebar` | добавить пункты «Тарифы»/«Учётки» если нужно (по мере) |
| DnD `SortableModuleList` | `onReorder` → POST reorder |

## Фаза 3 — Студенческие пробелы

| Что | Endpoint | UI |
|---|---|---|
| Профиль: редактирование имени/пароля | `PATCH /api/me`, `POST /api/me/password` | `/profile/edit` (новая страница) |
| Список покупок | `GET /api/purchases` (есть) | `/profile` блок «История покупок» |
| Восстановление пароля | `POST /api/auth/request-reset`, `POST /api/auth/reset` (mock email → лог в консоль) | `/auth/forgot`, `/auth/reset/[token]` |
| Кнопка «Выйти» в `SideDrawer` | `POST /api/auth/logout` (есть) | уже есть кнопка — добавить тест |

## Фаза 4 — Тесты Playwright

Дополнить текущие 18 кейсов:
- `05-admin-crud.spec.ts`: создание курса → модуля → урока → тарифа → удаление
- `06-admin-students.spec.ts`: список студентов, счётчики `/api/admin/stats`
- `07-student-extras.spec.ts`: logout-кнопка, edit-profile, forgot-password mock-flow, expiry тарифа (через прямую запись в БД)

## Что отложено
- Реальная оплата (webhook) — мок остаётся
- Загрузка видео (S3/MinIO)
- Email (сейчас «mock» в логе)
- PDF-сертификат (сейчас alert)
- Управление администраторами через UI
