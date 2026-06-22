import { test, expect } from '@playwright/test';
import {
  newAdminContext,
  newUserContext,
  createFullCourse,
  deleteCourseAPI,
  adminLoginUI,
} from './helpers';

test.describe('Часть III: Студенты', () => {
  test('3.57 + 3.58 GET /api/admin/students + фильтр q', async () => {
    const admin = await newAdminContext();
    const { user: u1, ctx: c1 } = await newUserContext();
    const { user: u2, ctx: c2 } = await newUserContext();
    try {
      const all = await admin.get('/api/admin/students');
      expect(all.ok()).toBeTruthy();
      const body = await all.json();
      expect(Array.isArray(body.students)).toBe(true);
      expect(body.students.length).toBeGreaterThanOrEqual(2);
      const item = body.students[0];
      expect(item.id).toBeTruthy();
      expect(item.email).toBeTruthy();
      expect(item._count).toBeDefined();

      // фильтр по уникальной части email
      const localPart = u1.email.split('@')[0];
      const filtered = await admin.get(`/api/admin/students?q=${encodeURIComponent(localPart)}`);
      expect(filtered.ok()).toBeTruthy();
      const fbody = await filtered.json();
      expect(fbody.students.length).toBe(1);
      expect(fbody.students[0].email).toBe(u1.email.toLowerCase());
    } finally {
      await c1.dispose();
      await c2.dispose();
      await admin.dispose();
    }
  });

  test('3.59 UI /admin/students показывает email (через поиск)', async ({ page }) => {
    const { user, ctx } = await newUserContext();
    try {
      await adminLoginUI(page);
      await page.goto('/admin/students');
      const localPart = user.email.split('@')[0];
      // admin-layout рендерит mobile + desktop trees → берём видимое.
      await page
        .getByPlaceholder(/Поиск/i)
        .filter({ visible: true })
        .first()
        .fill(localPart);
      await page
        .getByRole('button', { name: 'Найти' })
        .filter({ visible: true })
        .first()
        .click();
      await expect(
        page.getByText(user.email.toLowerCase()).filter({ visible: true }).first(),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await ctx.dispose();
    }
  });

  test('3.60 UI /admin/students/[id]', async ({ page }) => {
    const admin = await newAdminContext();
    const { user, ctx } = await newUserContext();
    try {
      const list = await admin.get(
        `/api/admin/students?q=${encodeURIComponent(user.email.split('@')[0])}`,
      );
      const body = await list.json();
      const studentId = body.students[0].id;

      await adminLoginUI(page);
      await page.goto(`/admin/students/${studentId}`);
      await expect(
        page.getByText(user.name).filter({ visible: true }).first(),
      ).toBeVisible({ timeout: 15_000 });
    } finally {
      await ctx.dispose();
      await admin.dispose();
    }
  });

  test('3.61 GET /api/admin/students/:id агрегирует прогресс', async () => {
    const admin = await newAdminContext();
    const { course, plan, freeLesson } = await createFullCourse(admin);
    const { user, ctx } = await newUserContext();
    try {
      await ctx.post('/api/purchases', { data: { planId: plan.id } });
      await ctx.post('/api/progress', { data: { lessonId: freeLesson.id } });

      const list = await admin.get(
        `/api/admin/students?q=${encodeURIComponent(user.email.split('@')[0])}`,
      );
      const studentId = (await list.json()).students[0].id;

      const r = await admin.get(`/api/admin/students/${studentId}`);
      expect(r.ok()).toBeTruthy();
      const body = await r.json();
      expect(body.user.email).toBe(user.email.toLowerCase());
      expect(Array.isArray(body.purchases)).toBe(true);
      expect(Array.isArray(body.progressByCourse)).toBe(true);
      const stat = body.progressByCourse.find((p: any) => p.courseId === course.id);
      expect(stat).toBeTruthy();
      expect(stat.completed).toBe(1);
      expect(stat.total).toBe(2);
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('3.62 GET /api/admin/students/:id несуществующий → 404', async () => {
    const admin = await newAdminContext();
    const r = await admin.get('/api/admin/students/no-such-student-id');
    expect(r.status()).toBe(404);
    await admin.dispose();
  });
});
