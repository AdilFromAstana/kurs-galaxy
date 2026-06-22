# Test Plan — KursGalaxy.kz (nail-academy-pro)

Полный набор тестов поведения для всех ролей (гость, студент, админ). Каждый тест — самодостаточная спецификация: предусловия → шаги → ожидания. Теги:

- `[UI]` — нужен браузер, проверяем DOM/визуал.
- `[API]` — Playwright `request` без UI.
- `[HYBRID]` — UI для setup (логин/регистрация), API для проверок и быстрого создания состояния.

Все эндпоинты проверены по коду (см. [middleware.ts](../middleware.ts), [app/api/](../app/api/), [prisma/schema.prisma](../prisma/schema.prisma)).

Раннер: Playwright. `baseURL` берётся из `PLAYWRIGHT_BASE_URL` (по умолчанию `http://localhost:39010`).

---

## 0. Подготовка

### 0.1 Переменные окружения (тестовый прогон)
| Переменная | Назначение |
|---|---|
| `PLAYWRIGHT_BASE_URL` | URL приложения. |
| `ADMIN_EMAIL` | По умолчанию `admin@nailacademy.com`. |
| `ADMIN_PASSWORD` | По умолчанию `admin123`. |
| `DATABASE_URL` | Тестовая БД; перед прогоном — `prisma migrate deploy && prisma db seed`. |
| `SESSION_SECRET` | ≥ 16 символов. |
| `RESEND_API_KEY` | Не обязателен — без него письма логируются. |

### 0.2 Хелперы (расширение [tests/e2e/helpers.ts](e2e/helpers.ts))
```ts
// Уже есть: newUser, registerViaUI, loginViaUI, logoutViaUI, fetchCourses
// Добавить:
export async function adminLoginUI(page: Page) { /* /admin/login → /admin */ }
export async function adminLoginAPI(request: APIRequestContext) { /* POST /api/admin/auth/login */ }
export async function createCourseAPI(request, slug, title) { /* POST /api/admin/courses */ }
export async function uploadVideoFixture(request, lessonId, mp4Path) { /* multipart */ }
export async function completeAllLessons(request, courseId) {
  const courses = await fetchCourses(request);
  const course = courses.find(c => c.id === courseId)!;
  for (const m of course.modules) {
    for (const l of m.lessons) {
      await request.post('/api/progress', { data: { lessonId: l.id } });
    }
  }
}
export function uniq(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`; }
```

### 0.3 Фикстуры
- `tests/fixtures/sample.mp4` — короткий валидный mp4 ~1 МБ (для upload).
- `tests/fixtures/sample.png` — PNG ~10 KB (для подписи/лого сертификата).
- `tests/fixtures/oversize.mp4` — генерируется в beforeAll если нужен (или используется flag-эмуляция через `Buffer.alloc`).
- `tests/fixtures/wrong.txt` — текстовый файл для проверки 415.

### 0.4 Структура файлов
```
tests/
├── TEST-PLAN.md                      ← этот документ
├── fixtures/
│   ├── sample.mp4
│   ├── sample.png
│   └── wrong.txt
└── e2e/
    ├── helpers.ts                    ← расширенный
    ├── 01-guest.spec.ts              ← 1.x
    ├── 02-auth-register-login.spec.ts ← 2.x
    ├── 03-auth-reset.spec.ts         ← 2.6
    ├── 04-catalog-public.spec.ts     ← 3.x
    ├── 05-purchase.spec.ts           ← 4.x
    ├── 06-lesson-access.spec.ts      ← 5.x
    ├── 07-progress.spec.ts           ← 6.x
    ├── 08-certificate.spec.ts        ← 7.x
    ├── 09-profile.spec.ts            ← 8.x
    ├── 10-admin-auth.spec.ts         ← 9.x
    ├── 11-admin-courses.spec.ts      ← 10.x
    ├── 12-admin-modules-lessons.spec.ts ← 11.x
    ├── 13-admin-video-upload.spec.ts ← 12.x
    ├── 14-admin-pricing.spec.ts      ← 13.x
    ├── 15-admin-students.spec.ts     ← 14.x
    ├── 16-admin-purchases.spec.ts    ← 15.x
    ├── 17-admin-certificate-settings.spec.ts ← 16.x
    ├── 18-admin-emails-stats.spec.ts ← 17.x
    └── 19-cross-role-security.spec.ts ← 18.x
```

---

# Часть I. Гость (неавторизованный)

## 1.1 Лендинг показывает CTA `[UI]`
**Шаги**: `goto('/')`.
**Ожидания**: `getByRole('heading', { name: 'KursGalaxy.kz' })`, `getByRole('link', { name: 'Начать обучение' })`, `getByRole('link', { name: 'Войти' })` видимы.

## 1.2 Каталог открыт без сессии `[UI]`
**Шаги**: `goto('/courses')`.
**Ожидания**: видна `heading` «Каталог курсов», есть хотя бы один published-курс из БД (через `fetchCourses(request)` берём первый title).

## 1.3 Страница курса (slug) открыта без сессии `[UI]`
**Предусловие**: `course = (await fetchCourses(request))[0]`.
**Шаги**: `goto('/course/' + course.slug)`.
**Ожидания**: видны `heading` `course.title`, секции «Программа курса», «Выберите тарифный план».

## 1.4 Страница курса по `id` (не только slug) `[API]`
**Шаги**: `GET /api/courses/${course.id}`.
**Ожидания**: 200, в ответе `course.slug === ...`.

## 1.5 Черновик курса не доступен гостю `[API]`
**Setup**: админом создать курс с `published:false`.
**Шаги (гостем, без cookie)**: `GET /api/courses/${draft.slug}`.
**Ожидания**: 404 `{ error: 'not_found' }`.
**И UI**: `goto('/course/' + draft.slug)` → не показывает контент (страница 404).

## 1.6 Middleware защищает приватные роуты `[UI]`
Параметризованный тест: для каждого пути из `['/dashboard', '/profile', '/profile/edit', '/lesson/some-id']`:
- `clearCookies()` → `goto(path)` → ожидается URL `/auth/login`.
Для `'/admin'`, `'/admin/courses'` → URL `/admin/login`.

## 1.7 Покупка с лендинга редиректит на регистрацию `[UI]`
**Шаги**: `goto('/courses')` → клик по кнопке «Купить» / соответствующему элементу первого курса.
**Ожидания**: URL содержит `/auth/register?course=`.

## 1.8 Регистрация валидная `[UI]`
**Шаги**: `registerViaUI(page, newUser('reg'))`.
**Ожидания**: URL `/dashboard`, заголовок «Мои курсы».

## 1.9 Регистрация с занятым email `[HYBRID]`
**Setup**: `request.post('/api/auth/register', { data: u1 })`.
**Шаги**: повторно через UI с тем же email.
**Ожидания**: видим `getByText(/уже существует/i)`, остаёмся на `/auth/register`.

## 1.10 Регистрация — все пустые `[API]`
**Шаги**: `POST /api/auth/register {}`.
**Ожидания**: 400 `{ error: 'Все поля обязательны' }`.

## 1.11 Регистрация — пароль < 6 `[API]`
**Шаги**: `POST /api/auth/register { name, email, password: '12345' }`.
**Ожидания**: 400.

## 1.12 Регистрация — невалидный email формат (опционально) `[API]`
> Текущий код не валидирует формат строго. Тест-факт: email просто приводится к lower-case. Записать как known behaviour, не assert «400».

## 1.13 Логин — happy path `[UI]`
`loginViaUI(page, registered)` → URL `/dashboard`.

## 1.14 Логин — неверный пароль `[UI]`
**Ожидания**: `getByText(/Неверный email или пароль/i)`.

## 1.15 Логин — несуществующий email `[API]`
`POST /api/auth/login { email: 'no-such@x.test', password: 'x' }` → 401.

## 1.16 Логин — пустые поля `[API]`
`POST /api/auth/login {}` → 400.

## 1.17 Logout очищает сессию `[API]`
**Setup**: register.
**Шаги**: `POST /api/auth/logout` → `GET /api/me`.
**Ожидания**: 200 на logout, `GET /api/me` → 401.

## 1.18 Forgot — несуществующий email `[API]`
`POST /api/auth/request-reset { email: 'no-user@test.local' }` → 200 (anti-enumeration).

## 1.19 Forgot → reset → login новым `[HYBRID]`
**Setup**: register `u`, logout.
**Шаги**:
1. `POST /api/auth/request-reset { email: u.email }` → 200, забрать `devToken` (если включён dev-fallback).
2. `goto('/auth/reset?token=' + devToken)`.
3. Заполнить «Новый пароль» и «Подтверждение» = `Reset123!`, submit.
4. `getByText(/Пароль обновлён/)`.
5. UI-логин `Reset123!` → `/dashboard`.

## 1.20 Reset — невалидный токен `[API]`
`POST /api/auth/reset { token: 'fake', newPassword: 'Whatever1' }` → 400.

## 1.21 Reset — короткий пароль `[API]`
`POST /api/auth/reset { token: validToken, newPassword: '123' }` → 400.

## 1.22 Reset — повторное использование токена `[API]`
**Setup**: запросить reset, использовать токен (200), снова с тем же → 400.

## 1.23 Reset — токен старше 1 часа `[API]` (требует прямой записи в БД через test-utility, либо мокать `Date`)
> Если без БД-доступа — пометить как `test.fixme()` с пояснением.

## 1.24 Гость не может работать с защищёнными API `[API]`
Параметризовать таблицей:
| Метод+путь | Тело | Ожидаемый код |
|---|---|---|
| `GET /api/me` | — | 401 |
| `PATCH /api/me/profile` | `{name:'x'}` | 401 |
| `POST /api/me/profile` | `{currentPassword:'x', newPassword:'yyyyyy'}` | 401 |
| `POST /api/purchases` | `{planId}` | 401 |
| `GET /api/purchases` | — | 401 |
| `POST /api/progress` | `{lessonId}` | 401 |
| `GET /api/progress` | — | 401 |
| `POST /api/last-lesson` | `{lessonId}` | 401 |
| `GET/POST /api/video-position` | — | 401 |
| `GET /api/lessons/:id/video` | — | 401 |
| `GET /api/courses/:id/certificate` | — | 401 |
| `GET /api/admin/courses` | — | 401 |
| `POST /api/admin/courses` | `{slug,title}` | 401 |
| `GET /api/admin/students` | — | 401 |
| `GET /api/admin/me` | — | 401 |

## 1.25 Верификация существующего сертификата `[HYBRID]`
**Setup**: студент проходит курс и качает PDF (через API из 7.x).
**Шаги**: гостем (новый context) `goto('/cert/verify/' + cert.id)`.
**Ожидания**: видны имя владельца, название курса, дата выдачи, ID сертификата, статус «Сертификат подлинный».

## 1.26 Верификация несуществующего сертификата `[UI]`
`goto('/cert/verify/INVALID-ID')` → видно «Сертификат не найден», ID отображён.

## 1.27 Гость с активной сессией редиректится с `/` на `/dashboard` `[UI]`
**Setup**: register (auto-логинит).
**Шаги**: `goto('/')`.
**Ожидания**: URL `/dashboard`.

---

# Часть II. Студент (авторизованный)

## 2.1 GET /api/me сразу после регистрации `[API]`
Регистрируемся через `request`, GET `/api/me` → 200; `purchases=[], progress=[], lastLessons=[]`, `user.email/name` совпадают.

## 2.2 PATCH имени `[API]`
`PATCH /api/me/profile { name: 'New Name PW' }` → 200; `GET /api/me` отдаёт новое имя; cookie обновлена (header session должен содержать новый name — проверяем через JSON ответ).

## 2.3 PATCH с пустым телом `[API]`
`PATCH /api/me/profile {}` → 400 `nothing to update`.

## 2.4 PATCH с whitespace-only name `[API]`
`PATCH /api/me/profile { name: '   ' }` → 400 (текущий код trim-ит и проверяет на truthy).

## 2.5 Смена пароля API → перелогин `[HYBRID]`
1. `POST /api/me/profile { currentPassword: u.password, newPassword: 'NewPass123!' }` → 200.
2. logout.
3. `POST /api/auth/login` со старым → 401.
4. `POST /api/auth/login` с новым → 200.

## 2.6 Смена пароля — неверный текущий `[API]`
→ 401 `Текущий пароль неверный`.

## 2.7 Смена пароля — слабый новый `[API]`
`{ currentPassword, newPassword: '123' }` → 400.

## 2.8 Смена пароля через UI `/profile/edit` `[UI]`
**Шаги**: register → `goto('/profile/edit')` → заполнить поля → submit → toast/успех.
**Ожидания**: можем залогиниться с новым паролем.

## 2.9 Дашборд показывает «Бесплатные курсы» сразу после регистрации `[UI]`
register → URL `/dashboard` → виден заголовок «Мои курсы», нет секции «Купленные курсы», есть «Бесплатные курсы (N)».

## 2.10 Каталог через UI под user `[UI]`
register → `goto('/courses')` → видим хотя бы один курс.

## 2.11 Страница курса под user без покупки `[UI]`
`goto('/course/' + slug)` → видны тарифы, видна кнопка «Купить» (без «полный доступ»).

## 2.12 Бесплатный урок открывается без покупки `[UI]`
`goto('/lesson/' + freeLesson.id)` → виден заголовок урока, элемент `<video>` смонтирован.

## 2.13 Платный урок без покупки → экран блокировки `[UI]`
`goto('/lesson/' + paidLesson.id)` → `getByRole('heading', { name: 'Урок заблокирован' })`, `button "Купить курс"`.

## 2.14 GET /api/lessons/:id/video — бесплатный, без покупки `[API]`
→ 200 (или 302 редирект на внешний URL, если `videoUrl` не локальный — оба валидны).

## 2.15 GET /api/lessons/:id/video — платный, без покупки `[API]`
→ 403 `no_access`.

## 2.16 Range-запрос работает на локальном видео `[API]`
**Pre**: админом залить локальное mp4 (тест 12.x). Получить `lesson.id`.
**Шаги под админом**: `GET /api/lessons/:id/video` с заголовком `Range: bytes=0-1023`.
**Ожидания**: 206; `content-range` начинается с `bytes 0-1023/`; `content-length: 1024`.

## 2.17 Range вне диапазона → 416 `[API]`
`Range: bytes=999999999-` → 416, есть заголовок `content-range: bytes */<size>`.

## 2.18 Покупка happy path `[HYBRID]`
1. register.
2. `POST /api/purchases { planId }` → 200; в ответе `purchase.status='ACTIVE'`, `paymentMethod='mock'`, `paymentStatus='COMPLETED'`.
3. `GET /api/me` → `purchases` содержит запись с `courseId, status:'ACTIVE'`.
4. `goto('/course/' + slug)`, `reload()` → видим «У вас есть полный доступ».

## 2.19 Покупка — UNLIMITED план `[API]`
План с `accessPeriod: 'UNLIMITED'`. После покупки `expiresAt === null`.

## 2.20 Покупка — без planId `[API]`
`POST /api/purchases {}` → 400 `planId required`.

## 2.21 Покупка — несуществующий planId `[API]`
→ 404 `plan not found`.

## 2.22 Покупка — неактивный план `[API]`
**Setup**: админом `PATCH /api/admin/pricing/:id { isActive: false }`.
**Шаги студентом**: `POST /api/purchases { planId }` → 404.

## 2.23 Покупка через PurchaseModal в UI `[UI]`
Под user открыть `/course/[slug]` → клик «Купить» → выбрать план → submit → реальный POST уходит → видим обновлённое состояние «полный доступ». Если код использует `window.location.reload()` — учитываем.

## 2.24 Истёкшая покупка блокирует видео `[API]`
**Setup**: купить план на 30 дней; вручную через DB или через админский эндпоинт PATCH `expiresAt` в прошлое. (Если нет доступа к БД — сделать `PATCH /api/admin/purchases/:id { extendDays: -100 }` НЕ сработает — поэтому помечаем как `test.fixme` или используем DB-helper.)
Ожидание после: `GET /api/lessons/:paidId/video` → 403 `access_expired`.

## 2.25 Активная покупка → доступ к платному видео `[API]`
После 2.18 → `GET /api/lessons/:paidId/video` → 200/206.

## 2.26 GET /api/purchases возвращает свои покупки `[API]`
После 2.18 → массив, в записях есть `plan` и `course {id, slug, title}`.

## 2.27 POST /api/progress — happy path `[API]`
`POST /api/progress { lessonId }` → 200; `GET /api/me.progress` содержит запись с `userId/lessonId/courseId`; в `lastLessons` есть запись.

## 2.28 POST /api/progress идемпотентен `[API]`
Повторный POST на тот же lessonId → 200, количество записей в `progress` не растёт.

## 2.29 POST /api/progress — несуществующий урок `[API]`
→ 404 `lesson not found`.

## 2.30 POST /api/progress без lessonId `[API]`
→ 400.

## 2.31 GET /api/progress — фильтр по courseId `[API]`
Создаём прогресс в курсе A и B → `GET /api/progress?courseId=${A}` → только A.

## 2.32 POST /api/last-lesson обновляет lastLesson `[API]`
Дважды POST с разными lessonId одного курса → `GET /api/me.lastLessons` отражает последний.

## 2.33 POST /api/last-lesson на странице урока `[UI]`
`goto('/lesson/' + freeLesson.id)` → ждём сетевой запрос на `/api/last-lesson` (можно `page.waitForRequest`) → `GET /api/me.lastLessons` содержит этот lessonId.

## 2.34 POST /api/video-position сохраняет время `[API]`
POST `{ lessonId, time: 42.5 }` → 200; GET `?lessonId=` → `{ time: 42.5 }`.

## 2.35 POST /api/video-position обновляет существующую запись `[API]`
POST 42.5, потом 99.0 → GET → 99.0.

## 2.36 POST /api/video-position — невалидный time `[API]`
`{ lessonId, time: 'abc' }` → 400.

## 2.37 GET /api/video-position без lessonId `[API]`
→ 400.

## 2.38 Сертификат — happy path `[HYBRID]`
1. register.
2. POST `/api/purchases`.
3. Для каждого `lesson.id` курса POST `/api/progress`.
4. `GET /api/courses/:id/certificate` → 200, content-type `application/pdf`, `content-disposition` содержит `attachment` и имя файла.
5. В БД (можно проверить через GET `/cert/verify/:id` гостем) появилась запись `Certificate` с `userName`, `courseTitle`.

## 2.39 Сертификат UI — кнопка «Скачать» появляется `[UI]`
После 2.38 `goto('/profile')` → видим «Сертификат готов!», `button "Скачать сертификат PDF"`. Клик открывает новую вкладку с PDF (можно проверить через `page.waitForEvent('popup')`).

## 2.40 Сертификат — без покупки `[API]`
Только прогресс (без POST `/api/purchases`) → 403 `no_access`.

## 2.41 Сертификат — не пройден полностью `[API]`
Купить, отметить только часть уроков → 403 `not_completed`, в теле `{ completed, total }`.

## 2.42 Сертификат — курс без уроков `[API]`
**Setup**: админом создать пустой курс + план; студент покупает.
**Шаги**: `GET /api/courses/:id/certificate` → 400 `no_lessons`.

## 2.43 Сертификат — истекший доступ `[API]`
2.24 + полное прохождение → 403 `access_expired`.

## 2.44 Стабильность ID сертификата `[API]`
Дважды вызвать `GET /api/courses/:id/certificate` → ID одинаковый, `issuedAt` не меняется (модель: `existing.id` сохраняется, обновляется только `userName/courseTitle/templateId`).

## 2.45 Обновление шаблона админом не меняет ID `[HYBRID]`
1. Студент скачивает сертификат → `cert.id = X`, `templateId = "classic-pink"`.
2. Админ `PATCH /api/admin/certificate-settings { templateId: "minimal" }`.
3. Студент снова скачивает → `cert.id` тот же `X`, `templateId` обновлён до `"minimal"`.
4. `GET /cert/verify/X` показывает имя и курс.

## 2.46 Logout `[API]`
`POST /api/auth/logout` → 200; `GET /api/me` → 401.

## 2.47 Профиль UI после прогресса `[UI]`
`goto('/profile')` → отображены проценты прогресса по курсам и `completed/total`.

## 2.48 Profile edit UI меняет имя `[UI]`
`goto('/profile/edit')` → меняем имя → submit → возврат на `/profile`, отображается новое имя.

## 2.49 Студент не может ходить в `/api/admin/*` `[API]`
Под user-cookie:
- `GET /api/admin/courses` → 401.
- `POST /api/admin/courses` → 401.
- `GET /api/admin/students` → 401.

## 2.50 Студент с user-cookie на `/admin` `[UI]`
`goto('/admin')` → редирект на `/admin/login` (middleware смотрит admin-cookie, отсутствует).

## 2.51 Сертификат — повторный download дает ту же ссылку верификации `[HYBRID]`
2.44 + затем гостем `GET /cert/verify/:id` оба раза → одна и та же страница с одним и тем же ID.

## 2.52 Бесплатный урок: видео под user → 200 `[API]`
`GET /api/lessons/:freeId/video` без покупки → 200 / 302.

## 2.53 Доступ к платному уроку через куку без активной purchase `[API]`
Страница `/course/[slug]` → клик на платный → если в БД нет purchase, ожидаем экран блокировки (см. 2.13).

## 2.54 LastLesson обновляется при отметке прогресса `[API]`
POST `/api/progress { lessonId: L1 }`; затем POST `/api/progress { lessonId: L2 }` (тот же курс) → `GET /api/me.lastLessons` для этого `courseId` содержит `L2`.

---

# Часть III. Админ

## 3.1 Гость на `/admin` редиректится `[UI]`
`clearCookies()` → `goto('/admin')` → URL `/admin/login`.

## 3.2 Логин админом UI `[UI]`
`adminLoginUI(page)` → URL `/admin`. Видим heading «Добро пожаловать,» (десктоп) или mobile-header (моб.).

## 3.3 Логин админом API (json) `[API]`
`POST /api/admin/auth/login { email, password }` → 200; cookie `nail_admin_session` установлена.

## 3.4 Логин админом API (formData) `[API]`
То же тело через `multipart/form-data` (см. код, поддерживается). Эквивалентный 200.

## 3.5 Неверный пароль `[API]`
`POST /api/admin/auth/login { email, password: 'wrong' }` → 401.

## 3.6 Несуществующий админ `[API]`
→ 401.

## 3.7 С активной admin-сессией `/admin/login` редиректит на `/admin` `[UI]`
**Setup**: `adminLoginUI`.
**Шаги**: `goto('/admin/login')` → URL `/admin`.

## 3.8 GET /api/admin/me `[API]`
Под адм-cookie → 200, `admin.email = ADMIN_EMAIL`, `role` = `'ADMIN'` или `'TEACHER'`.

## 3.9 Logout админа `[API]`
`POST /api/admin/auth/logout` → 200; `GET /api/admin/me` → 401.

## 3.10 Смена пароля админа `[HYBRID]`
1. `POST /api/admin/auth/change-password { currentPassword: ADMIN_PASSWORD, newPassword: 'NewAdm123!' }` → 200.
2. logout.
3. login со старым → 401.
4. login с новым → 200.
5. **Cleanup** в `afterAll`: вернуть пароль обратно на `ADMIN_PASSWORD`.

## 3.11 Смена пароля админа — кейсы валидации `[API]`
Таблица:
| Тело | Код | error |
|---|---|---|
| `{}` | 400 | `current_required` |
| `{ currentPassword: 'x' }` | 400 | `weak_password` (< 6) |
| `{ currentPassword: 'x', newPassword: 'shortx' }` | 400 | `wrong_password` |
| `{ currentPassword: ADMIN_PASSWORD, newPassword: ADMIN_PASSWORD }` | 400 | `same_password` |

## 3.12 Создание курса API `[API]`
`POST /api/admin/courses { slug, title, description }` → 201, `course.published = false`.

## 3.13 Создание курса — дубль slug `[API]`
Повторный с тем же slug → 409.

## 3.14 Создание курса — без slug/title `[API]`
`POST /api/admin/courses {}` → 400.

## 3.15 Создание курса UI `[UI]`
`adminLoginUI` → `goto('/admin/courses/create')` → заполнить поля → submit → URL `/admin/courses/[id]`. В списке `/admin/courses` курс виден.

## 3.16 GET /api/admin/courses включает черновики `[API]`
**Setup**: 3.12.
**Шаги**: `GET /api/admin/courses` → есть запись с `published: false`.
**И** `GET /api/courses` (под админ-cookie) → тоже есть.
**И** `GET /api/courses` без сессии → нет.

## 3.17 GET /api/admin/courses/:id (id и slug) `[API]`
По ID и по slug — оба возвращают тот же объект.

## 3.18 PATCH курс — published toggle `[API]`
`PATCH /api/admin/courses/:id { published: true }` → курс появляется в публичном `/api/courses` без сессии.

## 3.19 PATCH курс — конфликт slug `[API]`
**Setup**: создать `course1` и `course2`.
**Шаги**: `PATCH course1 { slug: course2.slug }` → 409.

## 3.20 PATCH курс — описание/название `[API]`
`PATCH /api/admin/courses/:id { title: 'Renamed', description: 'New desc' }` → 200; в `GET` отражено.

## 3.21 DELETE курса каскадно `[API]`
**Setup**: создать курс → модуль → урок → материал → план → оформить покупку студентом → отметить прогресс.
**Шаги**: `DELETE /api/admin/courses/:id` → 200.
**Проверки**:
- `GET /api/admin/lessons/:lessonId` → 404.
- `GET /api/admin/courses/:id` → 404.
- Студент: `GET /api/me.purchases` уже не содержит этой записи.
- `GET /api/me.progress` тоже очищен.

## 3.22 DELETE несуществующего курса `[API]`
→ 404.

## 3.23 Создание модуля `[API]`
`POST /api/admin/courses/:id/modules { title, description }` → 201; `order` подставлен корректно.

## 3.24 Создание модуля без title `[API]`
→ 400.

## 3.25 Создание модуля для несуществующего курса `[API]`
→ 404 `course_not_found`.

## 3.26 PATCH модуля `[API]`
`PATCH /api/admin/modules/:id { title, description, order }` → 200.

## 3.27 DELETE модуля каскадно убивает уроки `[API]`
Создать модуль с уроком → DELETE модуль → `GET /api/admin/lessons/:lessonId` → 404.

## 3.28 Reorder модулей `[API]`
**Setup**: 3 модуля.
**Шаги**: `POST /api/admin/reorder/modules { items: [{id:m3, order:0},{id:m2, order:1},{id:m1, order:2}] }`.
**Ожидания**: `GET /api/admin/courses/:id` возвращает модули в новом порядке.

## 3.29 Reorder с пустыми items `[API]`
`POST /api/admin/reorder/modules { items: [] }` → 400.

## 3.30 Создание урока `[API]`
`POST /api/admin/modules/:id/lessons { title, duration:'10:00', videoUrl:'https://...', content:'md', isFree:true }` → 201.

## 3.31 Создание урока с дефолтами `[API]`
`POST /api/admin/modules/:id/lessons { title }` → 201; `duration='00:00'`, `videoUrl=''`, `isFree=false`.

## 3.32 PATCH урока `[API]`
Меняем `title, duration, videoUrl, content, isFree, order` — все отражаются.

## 3.33 DELETE урока `[API]`
`DELETE /api/admin/lessons/:id` → 200; `GET ...` → 404.

## 3.34 Reorder уроков `[API]`
Аналогично 3.28 для `/api/admin/reorder/lessons`.

## 3.35 Загрузка видео — happy path `[API]`
**Шаги**: multipart `POST /api/admin/lessons/:id/video` с `tests/fixtures/sample.mp4` (поле `video`).
**Ожидания**: 200, `videoUrl` непустой; `GET /api/admin/lessons/:id` отражает.

## 3.36 Удаление видео `[API]`
После 3.35 → `DELETE /api/admin/lessons/:id/video` → 200; `lesson.videoUrl === ''`.

## 3.37 Загрузка — нет файла `[API]`
multipart без поля `video` → 400 `no_file`.

## 3.38 Загрузка — пустой файл `[API]`
multipart с `Buffer.alloc(0)` → 400 `empty_file`.

## 3.39 Загрузка — слишком большой `[API]`
multipart с буфером > MAX_VIDEO_SIZE → 413 `file_too_large`.
> При больших размерах используем Stream/`createReadStream` или генерим временный файл нужного размера. Может быть `test.fixme` если фикстура неподъёмна.

## 3.40 Загрузка — неправильный тип `[API]`
multipart с `tests/fixtures/wrong.txt`, MIME `text/plain` → 415 `unsupported_type`.

## 3.41 Загрузка — без `lesson` `[API]`
`POST /api/admin/lessons/non-existent-id/video` → 404 `lesson_not_found`.

## 3.42 Загрузка повторно — старый локальный файл удаляется `[API]`
1. Загрузить mp4 → `videoUrl1`.
2. Загрузить ещё один → `videoUrl2`.
3. `videoUrl1` (если локальный) больше не отдаёт 200 на стрим (нужен админ для запроса; путь стал недоступен — `file_missing`).

## 3.43 Стрим под админом без покупки `[API]`
Загрузить локальное видео → `GET /api/lessons/:id/video` под админ-cookie → 200/206 (без проверки `isFree` или `purchase`).

## 3.44 Стрим под user без сессии админа на платный без покупки `[API]`
То же видео → user без покупки → 403 `no_access`.

## 3.45 Создание материала `[API]`
`POST /api/admin/lessons/:id/materials { title, url, type:'PDF' }` → 201.

## 3.46 Материал — type fallback на LINK `[API]`
`POST ... { title, url, type:'EXOTIC' }` → 201, в записи `type: 'LINK'`.

## 3.47 Материал — без полей `[API]`
`POST ... { title:'', url:'' }` → 400.

## 3.48 DELETE материала `[API]`
`DELETE /api/admin/materials/:id` → 200; в `GET /api/admin/lessons/:id.materials` пусто.

## 3.49 Создание тарифа `[API]`
`POST /api/admin/courses/:id/pricing { name:'Базовый', accessPeriod:'ONE_MONTH', price:1000, currency:'KZT' }` → 201; `accessDays === 30`.

## 3.50 Тариф UNLIMITED `[API]`
`accessPeriod:'UNLIMITED'` → `accessDays === null`.

## 3.51 Тариф — невалидная цена `[API]`
`{ name:'X', price:-1 }` → 400; `{ name:'X', price:'abc' }` → 400.

## 3.52 Тариф — без name `[API]`
→ 400.

## 3.53 PATCH тарифа `[API]`
`PATCH /api/admin/pricing/:id { price:1500, isRecommended:true }` → 200.

## 3.54 PATCH тарифа — смена accessPeriod пересчитывает accessDays `[API]`
`PATCH ... { accessPeriod:'SIX_MONTHS' }` → `accessDays === 180`.

## 3.55 PATCH тарифа — isActive=false скрывает в публичном API `[API]`
`PATCH ... { isActive:false }` → `GET /api/courses/:slug` (гостем) больше не содержит этого плана в `pricingPlans` (фильтр `isActive: true`).

## 3.56 DELETE тарифа `[API]`
→ 200.

## 3.57 GET /api/admin/students `[API]`
Создать N студентов через registerAPI → `GET /api/admin/students` отдаёт ≥ N записей с полями `id, email, name, _count`.

## 3.58 GET /api/admin/students?q= фильтр `[API]`
`?q=<уникальная-часть-email>` → ровно одна запись.

## 3.59 UI /admin/students `[UI]`
`adminLoginUI` → `goto('/admin/students')` → видим email только что созданного студента (см. [05-admin-crud.spec.ts:102-113](e2e/05-admin-crud.spec.ts)).

## 3.60 UI /admin/students/[id] `[UI]`
Клик по студенту → видим purchases и блок прогресса.

## 3.61 GET /api/admin/students/:id агрегирует прогресс `[API]`
**Setup**: студент покупает курс A, проходит K уроков.
**Шаги**: `GET /api/admin/students/:id`.
**Ожидания**: `progressByCourse` содержит `{courseId:A, completed:K, total:N}`.

## 3.62 GET /api/admin/students/:id — несуществующий `[API]`
→ 404.

## 3.63 Ручная выдача доступа `[HYBRID]`
1. Создать студента через `request.post('/api/auth/register', { data: u })`.
2. Под админом `POST /api/admin/purchases { userId, planId }` → 200, `paymentMethod:'admin_manual'`.
3. Студент login → `GET /api/me.purchases` содержит запись.

## 3.64 Ручная выдача — отсутствующие поля `[API]`
`POST {}` → 400 `missing_fields`. `POST { userId }` → 400. `POST { planId }` → 400.

## 3.65 Ручная выдача — несуществующий userId/planId `[API]`
→ 404.

## 3.66 Продление подписки `[API]`
**Setup**: 3.63.
**Шаги**: `PATCH /api/admin/purchases/:id { extendDays: 30 }`.
**Ожидания**: `expiresAt` сдвигается на +30 дней относительно текущего значения (или от now() если истекла).

## 3.67 makeUnlimited `[API]`
`PATCH ... { makeUnlimited: true }` → `expiresAt === null`, `status === 'ACTIVE'`.

## 3.68 Изменение статуса `[API]`
`PATCH ... { status:'CANCELLED' }` → 200; студент: `GET /api/lessons/:paidId/video` → 403.

## 3.69 PATCH без полей `[API]`
`PATCH ... {}` → 400 `nothing_to_update`.

## 3.70 DELETE покупки — мягкое `[API]`
`DELETE /api/admin/purchases/:id` → 200; запись осталась со `status:'CANCELLED'`. Студенту доступ закрыт (видео — 403).

## 3.71 GET /api/admin/stats `[API]`
→ 200; типы полей `courses, students, lessons, modules, activePurchases` — number; растут после CRUD-операций.

## 3.72 Дашборд `/admin` `[UI]`
`adminLoginUI` → `goto('/admin')` → видны цифры курсов/студентов/доходов.

## 3.73 Сертификат-настройки GET `[API]`
`GET /api/admin/certificate-settings` → `{ settings, templates }`. `templates` содержит `classic-pink, gold-elegant, minimal` (id-шники).

## 3.74 Сертификат-настройки PATCH `[API]`
`PATCH ... { brandName:'Test Academy', titleText:'СЕРТ', qrEnabled:false }` → 200; повторный GET отражает.

## 3.75 PATCH unknown templateId `[API]`
`PATCH ... { templateId:'unknown' }` → 400 `unknown_template`.

## 3.76 Загрузка signature PNG `[API]`
multipart `POST /api/admin/certificate-settings/asset` с `kind=signature`, `file=sample.png` → 200 `{ url }`; `signaturePath` обновлён.

## 3.77 Загрузка logo `[API]`
То же с `kind=logo` → `logoPath` обновлён.

## 3.78 Asset — bad kind `[API]`
`kind=other` → 400.

## 3.79 Asset — нет файла `[API]`
без `file` → 400 `no_file`.

## 3.80 Asset — пустой `[API]`
0 байт → 400 `empty_file`.

## 3.81 Asset — слишком большой `[API]`
> MAX_IMAGE_SIZE → 413.

## 3.82 Asset — неправильный тип `[API]`
PDF/SVG → 415.

## 3.83 DELETE asset `[API]`
`DELETE /api/admin/certificate-settings/asset?kind=signature` → 200; `signaturePath: null`.

## 3.84 Загрузка нового signature удаляет старый файл `[API]`
1. Загрузить sig1 → `signaturePath = url1`.
2. Загрузить sig2 → `signaturePath = url2`, и url1 больше не доступен (404 при прямом GET статика, если применимо).

## 3.85 Preview сертификата `[API]`
`GET /api/admin/certificate-settings/preview` → 200, `application/pdf`, header `content-disposition: inline`.

## 3.86 Preview — пользовательский шаблон отражается в выходе `[API]`
PATCH `templateId='minimal'` → preview содержит другой PDF (можно сравнить byte-length с первым preview, должно отличаться). Простая проверка: оба раза 200.

## 3.87 Email expiry — GET `[API]`
**Setup**: студент с purchase, expiresAt через 3 дня (через PATCH/extendDays на свежесозданной мок-purchase).
**Шаги**: `GET /api/admin/email/expiry-warnings`.
**Ожидания**: `count >= 1`, в `expiring` есть наша запись.

## 3.88 Email expiry — POST отправляет `[API]`
**Setup**: то же.
**Шаги**: `POST /api/admin/email/expiry-warnings`.
**Ожидания**: `{ sent, failed, total }`. В dev (без `RESEND_API_KEY`) `failed >= 1` и `errors[]` не пустой — это ОК; ассертим только `total >= 1`.

## 3.89 Email expiry — никого не нашлось `[API]`
**Setup**: чистая БД или все purchases с большим expiresAt.
**Шаги**: `GET /api/admin/email/expiry-warnings` → `count === 0`. POST → `{ sent:0, failed:0, total:0 }`.

## 3.90 Settings UI — изменение брендинга `[UI]`
`goto('/admin/settings')` или `/admin/certificate` → меняем `brandName` → save → `getByText(...)` отражает.

## 3.91 Logout admin UI `[UI]`
В `/admin/settings` (или header) → клик «Выйти» → URL `/admin/login`.

---

# Часть IV. Кросс-ролевые и безопасность (`19-cross-role-security.spec.ts`)

## 4.1 Гость не может POST в admin-роуты `[API]`
Параметризованная таблица всех `/api/admin/*` POST/PATCH/DELETE → 401.

## 4.2 Студент с user-cookie не может в admin-роуты `[API]`
То же, под user-cookie.

## 4.3 Админ с admin-cookie без user-cookie не имеет user-данных `[API]`
Под admin-cookie `GET /api/me` → 401 (это user-роут).

## 4.4 Один пользователь не видит сертификат другого через download `[API]`
**Setup**: u1 проходит и скачивает сертификат курса C. u2 покупает C, но НЕ проходит.
**Шаги**: `GET /api/courses/C/certificate` под u2 → 403 `not_completed`. (По логике у каждого свой Certificate.)

## 4.5 Один user не может изменить чужой prog/purchase `[API]`
**Setup**: u1 регается, покупает план; u2 регается.
**Шаги**: u2 `GET /api/purchases` → не содержит покупок u1.
В коде нет эндпоинта для подмены `userId` со стороны клиента — но всё равно ассертим изоляцию через `/api/me`.

## 4.6 Видео локального файла не отдаётся через прямой статический URL без сессии `[API]`
> Если `videoUrl` начинается с `/api/lessons/.../video`, то всегда проходит через guard. Если есть прямые `/uploads/...` — проверить, что без сессии 403/redirect/404 (зависит от настройки `lib/uploads`). Если репо не отдаёт `/uploads` напрямую — assert: `GET '/uploads/...'` → 404.

## 4.7 Подмена admin-cookie невалидной строкой `[API]`
**Шаги**: `request.post(..., { headers: { cookie: 'nail_admin_session=GARBAGE' } })`.
**Ожидания**: 401.

## 4.8 SQL/`mode:'insensitive'` поиск студентов `[API]`
`GET /api/admin/students?q=' OR 1=1 --` → 200, не падает; результат — пусто или прямой substring match.

## 4.9 Path traversal в видео-URL не работает `[API]`
**Setup**: создать урок с `videoUrl: '../../../etc/passwd'` через `PATCH /api/admin/lessons/:id`.
**Шаги (под user/admin)**: `GET /api/lessons/:id/video`.
**Ожидания**: 400 `invalid_path` или 404 `file_missing` (см. `resolveLocalLessonPath` в `lib/uploads.ts`).

## 4.10 Race на покупку — две одновременные `[API]`
**Шаги**: `Promise.all([POST /api/purchases {planId}, POST /api/purchases {planId}])`.
**Ожидания**: обе 200 (нет уникального ограничения), но в `GET /api/me.purchases` 2 записи. Документируем как known behaviour.

---

# Часть V. Сквозные сценарии (smoke / journeys)

Эти тесты проверяют комплексные пользовательские пути. Хорошо сидят в отдельном файле `99-journeys.spec.ts`.

## 5.1 Journey: Гость → регистрация → покупка → урок → сертификат `[HYBRID]`
1. `clearCookies()` → `goto('/courses')` → клик «Купить» → URL `/auth/register?course=...`.
2. Заполнить форму → URL `/dashboard`.
3. `goto('/course/' + slug)`.
4. UI: открыть PurchaseModal, выбрать план, оплатить (mock).
5. `reload()` → видим «полный доступ».
6. Открыть первый урок → `<video>`.
7. Через API завершить все уроки (`completeAllLessons`).
8. `goto('/profile')` → видим «Сертификат готов!» → клик «Скачать сертификат PDF» → ловим popup → URL содержит `/api/courses/.../certificate`.
9. Гостем `goto('/cert/verify/' + cert.id)` → видим имя и курс.

## 5.2 Journey: Forgot → reset → login `[HYBRID]`
1. register → logout.
2. `/auth/forgot` → ввести email → submit → видим тост/успех.
3. Ловим devToken (через ответ `/api/auth/request-reset`).
4. `/auth/reset?token=...` → новый пароль → submit.
5. Логин новым → `/dashboard`.

## 5.3 Journey: Админ выкатывает курс с нуля `[HYBRID]`
1. `adminLoginUI`.
2. UI: `/admin/courses/create` — создать курс.
3. UI: добавить модуль.
4. UI: добавить урок.
5. API: `POST /api/admin/lessons/:id/video` (multipart, `sample.mp4`).
6. API: `POST /api/admin/lessons/:id/materials` (PDF link).
7. API: `POST /api/admin/courses/:id/pricing` (план).
8. UI: toggle «Опубликовать» → курс появляется в публичном `/courses`.
9. Создать тестового студента (registerAPI) → купить → пройти один free-урок.
10. UI: `/admin/students` — видим этого студента.

## 5.4 Journey: Ручная выдача доступа после офлайн-оплаты `[HYBRID]`
1. Студент регистрируется.
2. Админ `POST /api/admin/purchases { userId, planId }`.
3. Студент: `GET /api/me.purchases` содержит запись с `paymentMethod:'admin_manual'`.
4. Студент: `goto('/dashboard')` → курс в «Купленных».

## 5.5 Journey: Истечение доступа и продление `[HYBRID]`
1. Студент купил план.
2. Через тестовый DB-helper или cron-эмуляцию проставляем `expiresAt` в прошлое.
3. Студент: видео → 403 `access_expired`.
4. Админ: `PATCH /api/admin/purchases/:id { extendDays:30 }`.
5. Студент: видео → 200/206. UI: `/course/[slug]` → «полный доступ».

## 5.6 Journey: Изменение брендинга сертификата `[HYBRID]`
1. Студент сгенерировал сертификат с `templateId="classic-pink"`.
2. Админ `PATCH templateId="gold-elegant"`, грузит signature/logo.
3. Студент скачивает повторно → ID тот же, шаблон обновлён.
4. Гостем `/cert/verify/:id` → имя/курс/дата корректны.

## 5.7 Journey: Изоляция данных между студентами `[API]`
- u1 регистрируется, покупает A, проходит часть.
- u2 регистрируется, покупает A, проходит другую часть.
- `GET /api/me` под u1 — только его purchases/progress.
- `GET /api/me` под u2 — только его.

---

# Часть VI. Smoke-набор для CI (быстрый прогон)

Подмножество критических кейсов, проходящих за < 2 минут. Маркер `@smoke`:

- 1.1 (лендинг рендерится)
- 1.6 (защита роутов)
- 1.8 (регистрация)
- 1.13 (логин)
- 2.1 (`/api/me`)
- 2.18 (покупка happy path)
- 2.27 (прогресс)
- 2.38 (сертификат happy path)
- 3.2 (адм. логин)
- 3.12 + 3.18 (создание + публикация курса)
- 3.35 (загрузка видео)
- 5.1 (один journey)

Конфиг: `playwright test --grep @smoke`.

---

# Часть VII. Что вне покрытия / решения

| Тест | Причина |
|---|---|
| Реальная отправка писем (Resend) | В тестах достаточно ассертить `total/sent/failed` структуру; интеграция с Resend — отдельный e2e в staging. |
| Большие видеоупа (>200 MB) | Делаем фикстурой `Buffer.alloc(MAX_VIDEO_SIZE+1)` — иначе диск раздуется. |
| HMAC tampering | Покрыто 4.7. |
| CSRF | В коде `sameSite:'lax'` cookie — достаточно для текущего scope. |
| Конкурентная race на checkout | Документировано (4.10), не делаем assert на единственность. |
| Видео внешние URL (302) | Можно ассертить только статус 302 без следования; не качаем сторонние ресурсы. |

---

# Часть VIII. Ритм работы

1. **CI**: каждый PR прогоняет `--grep @smoke` (≤ 2 мин) + lint/typecheck.
2. **Nightly**: полный прогон всех файлов на staging-БД с фикстурами.
3. **Release**: ручной прогон journeys (5.x) + smoke перед деплоем.

Каждый файл `tests/e2e/*.spec.ts` начинается с `test.describe('<Часть>', () => { ... })` и использует `test.beforeAll`/`test.beforeEach` для setup (логин админа, регистрация студента, создание курса). Параллельность отключена (`fullyParallel: false`), так как тесты делят БД и сидовый админ — см. [playwright.config.ts](../playwright.config.ts).
