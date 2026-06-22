import { test, expect } from '@playwright/test';
import {
  newAdminContext,
  newUserContext,
  createFullCourse,
  deleteCourseAPI,
  createPlanAPI,
  registerViaUI,
  newUser,
  fetchCourses,
} from './helpers';

test.describe('Часть II: Покупка курса', () => {
  test('2.18 Покупка happy path', async () => {
    const admin = await newAdminContext();
    const { course, plan } = await createFullCourse(admin);
    const { ctx } = await newUserContext();
    try {
      const res = await ctx.post('/api/purchases', { data: { planId: plan.id } });
      expect(res.ok(), `purchase → ${res.status()}`).toBeTruthy();
      const body = await res.json();
      expect(body.purchase.status).toBe('ACTIVE');
      expect(body.purchase.paymentMethod).toBe('mock');
      expect(body.purchase.paymentStatus).toBe('COMPLETED');

      const me = await ctx.get('/api/me');
      const meBody = await me.json();
      const found = meBody.purchases.find(
        (p: any) => p.courseId === course.id && p.status === 'ACTIVE',
      );
      expect(found).toBeTruthy();
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.19 Покупка UNLIMITED — expiresAt === null', async () => {
    const admin = await newAdminContext();
    const { course } = await createFullCourse(admin);
    const unlimited = await createPlanAPI(admin, course.id, {
      name: 'Безлимит',
      accessPeriod: 'UNLIMITED',
      price: 9999,
    });
    const { ctx } = await newUserContext();
    try {
      const res = await ctx.post('/api/purchases', { data: { planId: unlimited.id } });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.purchase.expiresAt).toBeNull();
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.20 Покупка без planId → 400', async () => {
    const { ctx } = await newUserContext();
    const res = await ctx.post('/api/purchases', { data: {} });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('2.21 Покупка несуществующего planId → 404', async () => {
    const { ctx } = await newUserContext();
    const res = await ctx.post('/api/purchases', { data: { planId: 'no-such-plan-id' } });
    expect(res.status()).toBe(404);
    await ctx.dispose();
  });

  test('2.22 Покупка неактивного плана → 404', async () => {
    const admin = await newAdminContext();
    const { course, plan } = await createFullCourse(admin);
    await admin.patch(`/api/admin/pricing/${plan.id}`, { data: { isActive: false } });
    const { ctx } = await newUserContext();
    try {
      const res = await ctx.post('/api/purchases', { data: { planId: plan.id } });
      expect(res.status()).toBe(404);
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.23 Покупка через PurchaseModal в UI', async ({ page }) => {
    const admin = await newAdminContext();
    const { course } = await createFullCourse(admin);
    const u = newUser('buyui');
    await registerViaUI(page, u);

    await page.goto(`/course/${course.id}`);
    const buy = page
      .getByRole('button', { name: /Купить курс|Купить полный доступ|Зарегистрироваться и купить/ })
      .first();
    await expect(buy).toBeVisible();
    await buy.click();

    // в модалке выбираем план: кликаем по карточке (родителю, чьей onClick
    // выставляет selectedPlan). Нужен force, чтобы пробить overlay.
    const planCard = page
      .locator('div.cursor-pointer', { hasText: 'Базовый' })
      .first();
    await expect(planCard).toBeVisible();
    await planCard.click({ force: true });
    // Дожимаем кнопку «Оплатить» и ждём ответа на POST /api/purchases.
    const respPromise = page.waitForResponse(
      (r) => r.url().includes('/api/purchases') && r.request().method() === 'POST',
      { timeout: 15_000 },
    );
    await page.getByRole('button', { name: /Оплатить/ }).first().click({ force: true });
    await respPromise;
    // После клика страница вызывает window.location.reload — даём ей перезагрузиться.
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.goto(`/course/${course.slug}`);
    await expect(page.getByText('Полный доступ').first()).toBeVisible({
      timeout: 20_000,
    });

    await deleteCourseAPI(admin, course.id);
    await admin.dispose();
  });

  test('2.25 + 2.26 Активная покупка → доступ к платному видео + GET /api/purchases', async () => {
    const admin = await newAdminContext();
    const { course, paidLesson, plan } = await createFullCourse(admin);
    const { ctx } = await newUserContext();
    try {
      const buy = await ctx.post('/api/purchases', { data: { planId: plan.id } });
      expect(buy.ok()).toBeTruthy();

      const list = await ctx.get('/api/purchases');
      expect(list.ok()).toBeTruthy();
      const body = await list.json();
      expect(Array.isArray(body.purchases)).toBe(true);
      const item = body.purchases.find((p: any) => p.courseId === course.id);
      expect(item).toBeTruthy();
      expect(item.plan).toBeTruthy();
      expect(item.course).toBeTruthy();
      expect(item.course.slug).toBe(course.slug);

      // видео платного урока — внешний URL → 200/302
      const v = await ctx.get(`/api/lessons/${paidLesson.id}/video`, {
        maxRedirects: 0,
      });
      expect([200, 206, 301, 302, 307, 308]).toContain(v.status());
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });
});
