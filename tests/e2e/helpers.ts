import {
  Page,
  expect,
  APIRequestContext,
  request as pwRequest,
} from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// Загружаем .env в каждом воркере и переписываем DATABASE_URL под localhost.
(function loadDotEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)=(.*?)\s*$/i);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
  if (process.env.DATABASE_URL?.includes('@db:')) {
    const port = process.env.POSTGRES_PORT || '54390';
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
      /@db:\d+/,
      `@localhost:${port}`,
    );
  }
})();

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@nailacademy.com';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';
export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:39010';

export const FIXTURES_DIR = path.join(process.cwd(), 'tests', 'fixtures');
export const SAMPLE_MP4 = path.join(FIXTURES_DIR, 'sample.mp4');
export const SAMPLE_PNG = path.join(FIXTURES_DIR, 'sample.png');
export const WRONG_TXT = path.join(FIXTURES_DIR, 'wrong.txt');

let _prisma: PrismaClient | null = null;
export function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}
export async function disconnectPrisma(): Promise<void> {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null;
  }
}

export type TestUser = { name: string; email: string; password: string };

export function uniq(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function newUser(prefix = 'pw'): TestUser {
  const id = uniq(prefix);
  return {
    name: `${prefix} ${id}`,
    email: `${id}@test.local`,
    password: 'Test1234!',
  };
}

export async function registerViaUI(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/register');
  await page.getByLabel('Ваше имя').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Пароль').fill(user.password);
  await page.getByRole('button', { name: /Зарегистрироваться|Регистрируем/ }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

export async function loginViaUI(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Пароль').fill(user.password);
  await page.getByRole('button', { name: /Войти|Входим/ }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

export async function logoutViaUI(page: Page): Promise<void> {
  await page.request.post('/api/auth/logout');
  await page.context().clearCookies();
}

export async function registerAPI(
  api: APIRequestContext,
  user: TestUser,
): Promise<{ id: string; email: string; name: string }> {
  const res = await api.post('/api/auth/register', { data: user });
  expect(res.ok(), `register ${user.email} → ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return body.user;
}

export async function loginAPI(
  api: APIRequestContext,
  user: TestUser,
): Promise<void> {
  const res = await api.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  });
  expect(res.ok(), `login ${user.email} → ${res.status()}`).toBeTruthy();
}

export async function logoutAPI(api: APIRequestContext): Promise<void> {
  await api.post('/api/auth/logout');
}

export async function fetchCourses(api: APIRequestContext) {
  const res = await api.get('/api/courses');
  expect(res.ok(), `GET /api/courses → ${res.status()}`).toBeTruthy();
  const data = await res.json();
  return data.courses as Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    published: boolean;
    pricingPlans: Array<{
      id: string;
      name: string;
      price: number;
      isActive: boolean;
      isRecommended: boolean;
      accessPeriod: string;
      accessDays: number | null;
    }>;
    modules: Array<{
      id: string;
      title: string;
      order: number;
      lessons: Array<{
        id: string;
        title: string;
        isFree: boolean;
        order: number;
        videoUrl: string;
      }>;
    }>;
  }>;
}

export async function adminLoginUI(page: Page): Promise<void> {
  // Сначала проставляем admin-cookie через API (надёжнее, чем UI-форма
  // с её клиентским router.push, который иногда подвисает в e2e-окружении).
  const r = await page.request.post('/api/admin/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(r.ok(), `admin UI login → ${r.status()}`).toBeTruthy();
  // Затем посещаем страницу логина — middleware сам редиректит на /admin
  await page.goto('/admin/login');
  await page.waitForURL((url) => /^\/admin\/?$/.test(new URL(url).pathname), {
    timeout: 15_000,
  });
}

export async function adminLoginAPI(api: APIRequestContext): Promise<void> {
  const res = await api.post('/api/admin/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(res.ok(), `admin login → ${res.status()}`).toBeTruthy();
}

export async function adminLogoutAPI(api: APIRequestContext): Promise<void> {
  await api.post('/api/admin/auth/logout');
}

export async function newAdminContext(): Promise<APIRequestContext> {
  const ctx = await pwRequest.newContext({ baseURL: BASE_URL });
  await adminLoginAPI(ctx);
  return ctx;
}

export async function newUserContext(
  user?: TestUser,
): Promise<{ ctx: APIRequestContext; user: TestUser }> {
  const u = user ?? newUser('uctx');
  const ctx = await pwRequest.newContext({ baseURL: BASE_URL });
  await registerAPI(ctx, u);
  return { ctx, user: u };
}

export async function newGuestContext(): Promise<APIRequestContext> {
  return pwRequest.newContext({ baseURL: BASE_URL });
}

// =================== Admin CRUD helpers ===================

export type AdminCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  published: boolean;
};

export async function createCourseAPI(
  admin: APIRequestContext,
  data?: Partial<{ slug: string; title: string; description: string }>,
): Promise<AdminCourse> {
  const slug = data?.slug ?? uniq('course');
  const title = data?.title ?? `Course ${slug}`;
  const description = data?.description ?? `Description for ${slug}`;
  const res = await admin.post('/api/admin/courses', {
    data: { slug, title, description },
  });
  expect(res.ok(), `create course → ${res.status()} ${await res.text().catch(() => '')}`).toBeTruthy();
  const body = await res.json();
  return body.course as AdminCourse;
}

export async function publishCourseAPI(
  admin: APIRequestContext,
  courseId: string,
  published = true,
): Promise<void> {
  const res = await admin.patch(`/api/admin/courses/${courseId}`, {
    data: { published },
  });
  expect(res.ok(), `publish ${courseId} → ${res.status()}`).toBeTruthy();
}

export async function deleteCourseAPI(
  admin: APIRequestContext,
  courseId: string,
): Promise<void> {
  await admin.delete(`/api/admin/courses/${courseId}`);
}

export async function createModuleAPI(
  admin: APIRequestContext,
  courseId: string,
  data?: Partial<{ title: string; description: string }>,
): Promise<{ id: string; title: string; order: number }> {
  const title = data?.title ?? uniq('mod');
  const description = data?.description ?? '';
  const res = await admin.post(`/api/admin/courses/${courseId}/modules`, {
    data: { title, description },
  });
  expect(res.ok(), `create module → ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return body.module;
}

export async function createLessonAPI(
  admin: APIRequestContext,
  moduleId: string,
  data?: Partial<{
    title: string;
    duration: string;
    videoUrl: string;
    content: string;
    isFree: boolean;
  }>,
): Promise<any> {
  const payload = {
    title: data?.title ?? uniq('lesson'),
    duration: data?.duration ?? '00:30',
    videoUrl: data?.videoUrl ?? '',
    content: data?.content ?? '',
    isFree: data?.isFree ?? false,
  };
  const res = await admin.post(`/api/admin/modules/${moduleId}/lessons`, {
    data: payload,
  });
  expect(res.ok(), `create lesson → ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return body.lesson;
}

export async function createPlanAPI(
  admin: APIRequestContext,
  courseId: string,
  data?: Partial<{
    name: string;
    accessPeriod: string;
    price: number;
    currency: string;
    isActive: boolean;
    isRecommended: boolean;
  }>,
): Promise<any> {
  const payload = {
    name: data?.name ?? uniq('plan'),
    accessPeriod: data?.accessPeriod ?? 'ONE_MONTH',
    price: data?.price ?? 1000,
    currency: data?.currency ?? 'KZT',
    isActive: data?.isActive ?? true,
    isRecommended: data?.isRecommended ?? false,
  };
  const res = await admin.post(`/api/admin/courses/${courseId}/pricing`, {
    data: payload,
  });
  expect(res.ok(), `create plan → ${res.status()} ${await res.text().catch(() => '')}`).toBeTruthy();
  const body = await res.json();
  return body.plan;
}

export async function uploadVideoFixtureAPI(
  admin: APIRequestContext,
  lessonId: string,
  filePath = SAMPLE_MP4,
): Promise<{ videoUrl: string; size: number; type: string }> {
  const fs = await import('fs/promises');
  const buf = await fs.readFile(filePath);
  const res = await admin.post(`/api/admin/lessons/${lessonId}/video`, {
    multipart: {
      video: {
        name: path.basename(filePath),
        mimeType: 'video/mp4',
        buffer: buf,
      },
    },
  });
  expect(res.ok(), `upload video → ${res.status()} ${await res.text().catch(() => '')}`).toBeTruthy();
  return res.json();
}

// =================== Full course factory ===================

export type FullCourse = {
  course: AdminCourse;
  module: { id: string };
  freeLesson: any;
  paidLesson: any;
  plan: any;
};

export async function createFullCourse(
  admin: APIRequestContext,
  opts?: { published?: boolean; freeOnly?: boolean },
): Promise<FullCourse> {
  const course = await createCourseAPI(admin);
  const mod = await createModuleAPI(admin, course.id, { title: 'Модуль 1' });
  const freeLesson = await createLessonAPI(admin, mod.id, {
    title: 'Бесплатный урок',
    isFree: true,
    videoUrl: 'https://example.com/sample-free.mp4',
  });
  const paidLesson = await createLessonAPI(admin, mod.id, {
    title: 'Платный урок',
    isFree: false,
    videoUrl: 'https://example.com/sample-paid.mp4',
  });
  const plan = await createPlanAPI(admin, course.id, {
    name: 'Базовый',
    accessPeriod: 'ONE_MONTH',
    price: 1000,
  });
  if (opts?.published !== false) {
    await publishCourseAPI(admin, course.id, true);
  }
  return { course, module: mod, freeLesson, paidLesson, plan };
}

export async function completeAllLessons(
  api: APIRequestContext,
  courseId: string,
): Promise<void> {
  const courses = await fetchCourses(api);
  const c = courses.find((x) => x.id === courseId);
  if (!c) throw new Error(`completeAllLessons: course ${courseId} not in /api/courses`);
  for (const m of c.modules) {
    for (const l of m.lessons) {
      const r = await api.post('/api/progress', { data: { lessonId: l.id } });
      expect(r.ok(), `progress ${l.id} → ${r.status()}`).toBeTruthy();
    }
  }
}

// =================== DB helpers (Prisma) ===================

export async function expirePurchaseDB(purchaseId: string): Promise<void> {
  // Только сдвигаем expiresAt в прошлое, status оставляем ACTIVE.
  // Сертификат-роут различает no_access (status != ACTIVE) и
  // access_expired (status = ACTIVE + expiresAt < now).
  const p = getPrisma();
  await p.purchase.update({
    where: { id: purchaseId },
    data: {
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });
}

export async function setPurchaseExpiry(
  purchaseId: string,
  daysFromNow: number,
): Promise<void> {
  const p = getPrisma();
  await p.purchase.update({
    where: { id: purchaseId },
    data: {
      expiresAt: new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000),
    },
  });
}

export async function getResetTokenForUser(
  email: string,
): Promise<string | null> {
  // Сервер хранит только tokenHash. Тест подготавливает свой токен и
  // подменяет tokenHash в БД, возвращая исходный токен.
  const p = getPrisma();
  const user = await p.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;
  const latest = await p.passwordResetToken.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!latest) return null;
  const crypto = await import('crypto');
  const newToken = crypto.randomBytes(24).toString('hex');
  const newHash = crypto.createHash('sha256').update(newToken).digest('hex');
  await p.passwordResetToken.update({
    where: { id: latest.id },
    data: { tokenHash: newHash },
  });
  return newToken;
}

export async function setResetTokenExpired(email: string): Promise<void> {
  const p = getPrisma();
  const user = await p.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return;
  const latest = await p.passwordResetToken.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!latest) return;
  await p.passwordResetToken.update({
    where: { id: latest.id },
    data: { expiresAt: new Date(Date.now() - 60 * 1000) },
  });
}
