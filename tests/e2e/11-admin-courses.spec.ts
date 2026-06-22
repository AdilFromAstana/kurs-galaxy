import { test, expect } from '@playwright/test';
import {
  newAdminContext,
  newUserContext,
  newGuestContext,
  createCourseAPI,
  createFullCourse,
  publishCourseAPI,
  deleteCourseAPI,
  uniq,
  adminLoginUI,
} from './helpers';

test.describe('Часть III: Курсы (админ)', () => {
  test('3.12 Создание курса API → published:false', async () => {
    const admin = await newAdminContext();
    const slug = uniq('c');
    const r = await admin.post('/api/admin/courses', {
      data: { slug, title: 'Test course', description: 'Desc' },
    });
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(body.course.published).toBe(false);
    expect(body.course.slug).toBe(slug);
    await deleteCourseAPI(admin, body.course.id);
    await admin.dispose();
  });

  test('3.13 Создание курса — дубль slug → 409', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    const r = await admin.post('/api/admin/courses', {
      data: { slug: c.slug, title: 'dup', description: '' },
    });
    expect(r.status()).toBe(409);
    await deleteCourseAPI(admin, c.id);
    await admin.dispose();
  });

  test('3.14 Создание курса — без slug/title → 400', async () => {
    const admin = await newAdminContext();
    const r = await admin.post('/api/admin/courses', { data: {} });
    expect(r.status()).toBe(400);
    await admin.dispose();
  });

  test('3.15 Создание курса UI', async ({ page }) => {
    await adminLoginUI(page);
    await page.goto('/admin/courses/create');
    const title = 'UI Course ' + uniq('cui');
    // Admin layout рендерит дерево детей дважды (mobile + desktop tree).
    // Берём только видимые на текущем viewport (desktop) элементы.
    const titleInput = page.locator('input#title').filter({ visible: true });
    const descTextarea = page.locator('textarea#description').filter({ visible: true });
    const priceInput = page.locator('input#price').filter({ visible: true });
    await titleInput.fill(title);
    await descTextarea.fill('UI desc');
    await priceInput.fill('1500');
    await page
      .getByRole('button', { name: /Создать|Сохранить/i })
      .filter({ visible: true })
      .first()
      .click();
    await page.waitForURL(/\/admin\/courses\/[^/]+/, { timeout: 15_000 });

    await page.goto('/admin/courses');
    await expect(
      page.getByText(title).filter({ visible: true }).first(),
    ).toBeVisible();

    // cleanup
    const admin = await newAdminContext();
    const list = await admin.get('/api/admin/courses');
    const body = await list.json();
    const created = body.courses.find((c: any) => c.title === title);
    if (created) await deleteCourseAPI(admin, created.id);
    await admin.dispose();
  });

  test('3.16 GET /api/admin/courses включает черновики', async () => {
    const admin = await newAdminContext();
    const draft = await createCourseAPI(admin);
    try {
      const list = await admin.get('/api/admin/courses');
      expect(list.ok()).toBeTruthy();
      const body = await list.json();
      const found = body.courses.find((c: any) => c.id === draft.id);
      expect(found).toBeTruthy();
      expect(found.published).toBe(false);

      // публичный API без сессии — нет
      const guest = await newGuestContext();
      const pub = await guest.get('/api/courses');
      const pubBody = await pub.json();
      expect(pubBody.courses.find((c: any) => c.id === draft.id)).toBeFalsy();
      await guest.dispose();
    } finally {
      await deleteCourseAPI(admin, draft.id);
      await admin.dispose();
    }
  });

  test('3.17 GET /api/admin/courses/:id (id и slug)', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    try {
      const byId = await admin.get(`/api/admin/courses/${c.id}`);
      const bySlug = await admin.get(`/api/admin/courses/${c.slug}`);
      expect(byId.ok()).toBeTruthy();
      expect(bySlug.ok()).toBeTruthy();
      expect((await byId.json()).course.id).toBe((await bySlug.json()).course.id);
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.18 PATCH курс — published toggle', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    try {
      await publishCourseAPI(admin, c.id, true);
      const guest = await newGuestContext();
      const r = await guest.get('/api/courses');
      const body = await r.json();
      expect(body.courses.find((x: any) => x.id === c.id)).toBeTruthy();
      await guest.dispose();
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.19 PATCH курс — конфликт slug → 409', async () => {
    const admin = await newAdminContext();
    const c1 = await createCourseAPI(admin);
    const c2 = await createCourseAPI(admin);
    try {
      const r = await admin.patch(`/api/admin/courses/${c1.id}`, {
        data: { slug: c2.slug },
      });
      expect(r.status()).toBe(409);
    } finally {
      await deleteCourseAPI(admin, c1.id);
      await deleteCourseAPI(admin, c2.id);
      await admin.dispose();
    }
  });

  test('3.20 PATCH курс — описание/название', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    try {
      const r = await admin.patch(`/api/admin/courses/${c.id}`, {
        data: { title: 'Renamed', description: 'New desc' },
      });
      expect(r.ok()).toBeTruthy();
      const get = await admin.get(`/api/admin/courses/${c.id}`);
      const body = await get.json();
      expect(body.course.title).toBe('Renamed');
      expect(body.course.description).toBe('New desc');
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.21 DELETE курса каскадно', async () => {
    const admin = await newAdminContext();
    const { course, paidLesson, plan } = await createFullCourse(admin);
    const { ctx } = await newUserContext();

    await ctx.post('/api/purchases', { data: { planId: plan.id } });
    await ctx.post('/api/progress', { data: { lessonId: paidLesson.id } });

    const del = await admin.delete(`/api/admin/courses/${course.id}`);
    expect(del.ok()).toBeTruthy();

    const lesson = await admin.get(`/api/admin/lessons/${paidLesson.id}`);
    expect(lesson.status()).toBe(404);
    const courseAfter = await admin.get(`/api/admin/courses/${course.id}`);
    expect(courseAfter.status()).toBe(404);

    const me = await ctx.get('/api/me');
    const body = await me.json();
    expect(body.purchases.find((p: any) => p.courseId === course.id)).toBeFalsy();
    expect(body.progress.find((p: any) => p.courseId === course.id)).toBeFalsy();

    await ctx.dispose();
    await admin.dispose();
  });

  test('3.22 DELETE несуществующего курса → 404', async () => {
    const admin = await newAdminContext();
    const r = await admin.delete('/api/admin/courses/no-such-course-id');
    expect(r.status()).toBe(404);
    await admin.dispose();
  });
});
