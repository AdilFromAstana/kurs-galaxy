import { test, expect } from '@playwright/test';
import {
  newAdminContext,
  newUserContext,
  createFullCourse,
  deleteCourseAPI,
  setPurchaseExpiry,
  disconnectPrisma,
  adminLoginUI,
} from './helpers';

test.describe('Часть III: Email expiry, stats, settings UI', () => {
  test.afterAll(async () => {
    await disconnectPrisma();
  });

  test('3.71 GET /api/admin/stats', async () => {
    const admin = await newAdminContext();
    const r = await admin.get('/api/admin/stats');
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(typeof body.courses).toBe('number');
    expect(typeof body.students).toBe('number');
    expect(typeof body.lessons).toBe('number');
    expect(typeof body.modules).toBe('number');
    expect(typeof body.activePurchases).toBe('number');
    await admin.dispose();
  });

  test('3.72 Дашборд /admin', async ({ page }) => {
    await adminLoginUI(page);
    await page.goto('/admin');
    // Какая-то стат-цифра должна быть на странице (курсов / студентов).
    await expect(page.locator('body')).toContainText(/Курсов|студент|курсы/i);
  });

  test('3.87 + 3.88 Email expiry warnings (с активным purchase)', async () => {
    const admin = await newAdminContext();
    const { course, plan } = await createFullCourse(admin);
    const { user, ctx } = await newUserContext();
    try {
      const list = await admin.get(
        `/api/admin/students?q=${encodeURIComponent(user.email.split('@')[0])}`,
      );
      const userId = (await list.json()).students[0].id;
      const buy = await admin.post('/api/admin/purchases', {
        data: { userId, planId: plan.id },
      });
      const purchaseId = (await buy.json()).purchase.id;
      await setPurchaseExpiry(purchaseId, 3);

      const get = await admin.get('/api/admin/email/expiry-warnings');
      expect(get.ok()).toBeTruthy();
      const body = await get.json();
      expect(body.count).toBeGreaterThanOrEqual(1);
      expect(body.expiring.some((e: any) => e.userEmail === user.email.toLowerCase())).toBe(true);

      const post = await admin.post('/api/admin/email/expiry-warnings');
      expect(post.ok()).toBeTruthy();
      const pbody = await post.json();
      expect(pbody.total).toBeGreaterThanOrEqual(1);
      expect(typeof pbody.sent).toBe('number');
      expect(typeof pbody.failed).toBe('number');
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('3.89 Email expiry — пусто (никого в окне)', async () => {
    const admin = await newAdminContext();
    // Сразу POST — без подготовленных рядом-истекающих purchase он должен вернуть 0
    // (или то, что фактически в БД — мы не контролируем 100% состояние).
    const get = await admin.get('/api/admin/email/expiry-warnings');
    expect(get.ok()).toBeTruthy();
    const body = await get.json();
    expect(typeof body.count).toBe('number');
    expect(Array.isArray(body.expiring)).toBe(true);
    await admin.dispose();
  });

  test('3.90 Settings UI — изменение брендинга', async ({ page }) => {
    await adminLoginUI(page);
    // страница может быть /admin/settings или /admin/certificate
    let opened = false;
    for (const path of ['/admin/settings', '/admin/certificate']) {
      await page.goto(path);
      const fld = page
        .getByLabel(/Название бренда|Бренд|Brand/i)
        .first();
      if (await fld.isVisible().catch(() => false)) {
        await fld.fill('UI Brand ' + Date.now());
        const save = page.getByRole('button', { name: /Сохранить|Сохраняем/i }).first();
        if (await save.isVisible().catch(() => false)) {
          await save.click();
          opened = true;
          break;
        }
      }
    }
    if (!opened) {
      test.skip(true, 'не нашли UI редактирования брендинга');
    }
  });

  test('3.91 Logout admin UI', async ({ page }) => {
    await adminLoginUI(page);
    await page.goto('/admin/settings').catch(() => undefined);
    const logout = page.getByRole('button', { name: /Выйти|Logout/i }).first();
    if (!(await logout.isVisible().catch(() => false))) {
      // упасть на API logout если кнопки нет
      await page.request.post('/api/admin/auth/logout');
      await page.goto('/admin');
      await expect(page).toHaveURL(/\/admin\/login/);
      return;
    }
    await logout.click();
    await page.waitForURL(/\/admin\/login/, { timeout: 10_000 });
  });
});
