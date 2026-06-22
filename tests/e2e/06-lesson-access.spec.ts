import { test, expect } from '@playwright/test';
import {
  newAdminContext,
  newUserContext,
  createFullCourse,
  deleteCourseAPI,
  uploadVideoFixtureAPI,
  registerViaUI,
  newUser,
  loginViaUI,
} from './helpers';

test.describe('Часть II: Доступ к урокам и видео', () => {
  test('2.12 Бесплатный урок открывается без покупки (UI)', async ({ page }) => {
    const admin = await newAdminContext();
    const { course, freeLesson } = await createFullCourse(admin);
    const u = newUser('free-ui');
    await registerViaUI(page, u);
    await page.goto(`/lesson/${freeLesson.id}`);
    await expect(page.getByRole('heading', { name: freeLesson.title })).toBeVisible();
    await expect(page.locator('video')).toBeVisible();

    await deleteCourseAPI(admin, course.id);
    await admin.dispose();
  });

  test('2.13 Платный урок без покупки → экран блокировки (UI)', async ({ page }) => {
    const admin = await newAdminContext();
    const { course, paidLesson } = await createFullCourse(admin);
    const u = newUser('locked-ui');
    await registerViaUI(page, u);
    await page.goto(`/lesson/${paidLesson.id}`);
    await expect(page.getByRole('heading', { name: 'Урок заблокирован' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: /Купить курс/ })).toBeVisible();

    await deleteCourseAPI(admin, course.id);
    await admin.dispose();
  });

  test('2.14 GET бесплатное видео без покупки (user и гость)', async () => {
    const admin = await newAdminContext();
    const { course, freeLesson } = await createFullCourse(admin);
    const { ctx: userCtx } = await newUserContext();
    const { newGuestContext } = await import('./helpers');
    const guestCtx = await newGuestContext();
    try {
      // user без покупки
      const r1 = await userCtx.get(`/api/lessons/${freeLesson.id}/video`, { maxRedirects: 0 });
      expect([200, 206, 301, 302, 307, 308]).toContain(r1.status());
      // гость без сессии — тоже должен получить
      const r2 = await guestCtx.get(`/api/lessons/${freeLesson.id}/video`, { maxRedirects: 0 });
      expect([200, 206, 301, 302, 307, 308]).toContain(r2.status());
    } finally {
      await userCtx.dispose();
      await guestCtx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.14b Гость на платном видео → 401', async () => {
    const admin = await newAdminContext();
    const { course, paidLesson } = await createFullCourse(admin);
    const { newGuestContext } = await import('./helpers');
    const guestCtx = await newGuestContext();
    try {
      const r = await guestCtx.get(`/api/lessons/${paidLesson.id}/video`, { maxRedirects: 0 });
      expect(r.status()).toBe(401);
    } finally {
      await guestCtx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.15 GET платное видео без покупки → 403 no_access', async () => {
    const admin = await newAdminContext();
    const { course, paidLesson } = await createFullCourse(admin);
    const { ctx } = await newUserContext();
    try {
      const r = await ctx.get(`/api/lessons/${paidLesson.id}/video`, { maxRedirects: 0 });
      expect(r.status()).toBe(403);
      const body = await r.json().catch(() => ({}));
      expect(body.error).toBe('no_access');
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.16 Range-запрос на локальном видео (admin)', async () => {
    const admin = await newAdminContext();
    const { course, paidLesson } = await createFullCourse(admin);
    try {
      await uploadVideoFixtureAPI(admin, paidLesson.id);
      const r = await admin.get(`/api/lessons/${paidLesson.id}/video`, {
        headers: { Range: 'bytes=0-1023' },
      });
      expect(r.status()).toBe(206);
      const cr = r.headers()['content-range'];
      expect(cr).toMatch(/^bytes 0-1023\//);
      expect(r.headers()['content-length']).toBe('1024');
    } finally {
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.17 Range вне диапазона → 416', async () => {
    const admin = await newAdminContext();
    const { course, paidLesson } = await createFullCourse(admin);
    try {
      await uploadVideoFixtureAPI(admin, paidLesson.id);
      const r = await admin.get(`/api/lessons/${paidLesson.id}/video`, {
        headers: { Range: 'bytes=999999999-' },
      });
      expect(r.status()).toBe(416);
      expect(r.headers()['content-range']).toMatch(/^bytes \*\//);
    } finally {
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });
});
