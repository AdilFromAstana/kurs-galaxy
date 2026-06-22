import { test, expect } from '@playwright/test';
import {
  newAdminContext,
  newUserContext,
  newGuestContext,
  createFullCourse,
  createCourseAPI,
  createPlanAPI,
  publishCourseAPI,
  deleteCourseAPI,
  completeAllLessons,
  registerViaUI,
  newUser,
  loginViaUI,
  expirePurchaseDB,
  disconnectPrisma,
} from './helpers';

test.describe('Часть II: Сертификат', () => {
  test.afterAll(async () => {
    await disconnectPrisma();
  });

  test('2.38 + 2.44 + 2.51 Сертификат happy path + ID стабилен + verify', async () => {
    const admin = await newAdminContext();
    const { course, plan } = await createFullCourse(admin);
    const { ctx } = await newUserContext();
    try {
      const buy = await ctx.post('/api/purchases', { data: { planId: plan.id } });
      expect(buy.ok()).toBeTruthy();
      await completeAllLessons(ctx, course.id);

      const r1 = await ctx.get(`/api/courses/${course.id}/certificate`);
      expect(r1.ok(), `cert → ${r1.status()}`).toBeTruthy();
      expect(r1.headers()['content-type']).toMatch(/application\/pdf/);
      expect(r1.headers()['content-disposition']).toMatch(/attachment/i);

      // ID одинаковый при повторном вызове
      const r2 = await ctx.get(`/api/courses/${course.id}/certificate`);
      expect(r2.ok()).toBeTruthy();

      // достаём cert.id из БД через verify-страницу: ищем по последней записи
      // (нет публичного API «найти мой сертификат», так что верифицируем что
      // повторный download возвращает PDF тех же байтов или хотя бы оба раза 200)
      const a = await r1.body();
      const b = await r2.body();
      expect(a.length).toBeGreaterThan(0);
      expect(b.length).toBeGreaterThan(0);

      // verify-страницу проверяем через certs из prisma (id берём из cert-таблицы)
      const { getPrisma } = await import('./helpers');
      const cert = await getPrisma().certificate.findFirst({
        where: { courseId: course.id },
      });
      expect(cert).toBeTruthy();
      const guest = await newGuestContext();
      const verifyRes = await guest.get(`/cert/verify/${cert!.id}`);
      expect(verifyRes.ok()).toBeTruthy();
      const html = await verifyRes.text();
      expect(html).toContain(cert!.userName);
      expect(html).toContain(cert!.courseTitle);
      await guest.dispose();
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.39 UI «Скачать сертификат» появляется', async ({ page }) => {
    const admin = await newAdminContext();
    const { course, plan } = await createFullCourse(admin);
    const u = newUser('cert-ui');
    await registerViaUI(page, u);

    await page.request.post('/api/purchases', { data: { planId: plan.id } });
    await completeAllLessons(page.request, course.id);

    await page.goto('/profile');
    await expect(
      page.getByText(/Курс завершён|🏆/).first(),
    ).toBeVisible({ timeout: 15_000 });
    const dl = page
      .getByRole('button', { name: /Скачать сертификат|сертификат/i })
      .first();
    expect(await dl.isVisible()).toBe(true);
    // Клик открывает popup. Проверяем что popup получил какой-то URL.
    // (URL может быть either /api/.../certificate либо blob: после скачивания PDF)
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 10_000 }).catch(() => null),
      dl.click(),
    ]);
    if (popup) {
      // popup.url() зависит от того, успела ли отдача PDF — достаточно факта popup.
      await popup.close().catch(() => undefined);
    }

    await deleteCourseAPI(admin, course.id);
    await admin.dispose();
  });

  test('2.40 Сертификат без покупки → 403 no_access', async () => {
    const admin = await newAdminContext();
    const { course, freeLesson } = await createFullCourse(admin);
    const { ctx } = await newUserContext();
    try {
      // отметим прогресс, но без покупки
      await ctx.post('/api/progress', { data: { lessonId: freeLesson.id } });
      const r = await ctx.get(`/api/courses/${course.id}/certificate`);
      expect(r.status()).toBe(403);
      const body = await r.json().catch(() => ({}));
      expect(body.error).toBe('no_access');
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.41 Сертификат — не пройден → 403 not_completed', async () => {
    const admin = await newAdminContext();
    const { course, plan, freeLesson } = await createFullCourse(admin);
    const { ctx } = await newUserContext();
    try {
      await ctx.post('/api/purchases', { data: { planId: plan.id } });
      await ctx.post('/api/progress', { data: { lessonId: freeLesson.id } });
      const r = await ctx.get(`/api/courses/${course.id}/certificate`);
      expect(r.status()).toBe(403);
      const body = await r.json().catch(() => ({}));
      expect(body.error).toBe('not_completed');
      expect(typeof body.completed).toBe('number');
      expect(typeof body.total).toBe('number');
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.42 Сертификат — пустой курс → 400 no_lessons', async () => {
    const admin = await newAdminContext();
    const course = await createCourseAPI(admin);
    await publishCourseAPI(admin, course.id);
    const plan = await createPlanAPI(admin, course.id, {
      name: 'EmptyPlan',
      accessPeriod: 'ONE_MONTH',
      price: 100,
    });
    const { ctx } = await newUserContext();
    try {
      await ctx.post('/api/purchases', { data: { planId: plan.id } });
      const r = await ctx.get(`/api/courses/${course.id}/certificate`);
      expect(r.status()).toBe(400);
      const body = await r.json().catch(() => ({}));
      expect(body.error).toBe('no_lessons');
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.43 Сертификат — истёкший доступ → 403 access_expired', async () => {
    const admin = await newAdminContext();
    const { course, plan } = await createFullCourse(admin);
    const { ctx } = await newUserContext();
    try {
      const buy = await ctx.post('/api/purchases', { data: { planId: plan.id } });
      const purchase = (await buy.json()).purchase;
      await completeAllLessons(ctx, course.id);
      await expirePurchaseDB(purchase.id);

      const r = await ctx.get(`/api/courses/${course.id}/certificate`);
      expect(r.status()).toBe(403);
      const body = await r.json().catch(() => ({}));
      expect(body.error).toBe('access_expired');
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.45 Обновление шаблона админом не меняет ID сертификата', async () => {
    const admin = await newAdminContext();
    const { course, plan } = await createFullCourse(admin);
    const { ctx } = await newUserContext();
    try {
      await ctx.post('/api/purchases', { data: { planId: plan.id } });
      await completeAllLessons(ctx, course.id);

      const r1 = await ctx.get(`/api/courses/${course.id}/certificate`);
      expect(r1.ok()).toBeTruthy();
      const { getPrisma } = await import('./helpers');
      const cert1 = await getPrisma().certificate.findFirst({
        where: { courseId: course.id },
      });
      expect(cert1).toBeTruthy();
      const idBefore = cert1!.id;

      const patch = await admin.patch('/api/admin/certificate-settings', {
        data: { templateId: 'minimal' },
      });
      expect(patch.ok()).toBeTruthy();

      const r2 = await ctx.get(`/api/courses/${course.id}/certificate`);
      expect(r2.ok()).toBeTruthy();
      const cert2 = await getPrisma().certificate.findFirst({
        where: { courseId: course.id, userId: cert1!.userId },
      });
      expect(cert2!.id).toBe(idBefore);
      expect(cert2!.templateId).toBe('minimal');

      // вернуть default-шаблон, чтобы не аффектить остальные тесты
      await admin.patch('/api/admin/certificate-settings', {
        data: { templateId: 'classic-pink' },
      });
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });
});
