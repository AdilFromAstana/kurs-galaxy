import { test, expect } from '@playwright/test';
import {
  newAdminContext,
  newUserContext,
  createFullCourse,
  deleteCourseAPI,
  uploadVideoFixtureAPI,
} from './helpers';

test.describe('Часть III: Покупки (админ)', () => {
  test('3.63 Ручная выдача доступа', async () => {
    const admin = await newAdminContext();
    const { course, plan } = await createFullCourse(admin);
    const { user, ctx } = await newUserContext();
    try {
      const list = await admin.get(
        `/api/admin/students?q=${encodeURIComponent(user.email.split('@')[0])}`,
      );
      const userId = (await list.json()).students[0].id;

      const r = await admin.post('/api/admin/purchases', {
        data: { userId, planId: plan.id },
      });
      expect(r.ok()).toBeTruthy();
      const body = await r.json();
      expect(body.purchase.paymentMethod).toBe('admin_manual');

      const me = await ctx.get('/api/me');
      const meBody = await me.json();
      expect(
        meBody.purchases.find((p: any) => p.courseId === course.id),
      ).toBeTruthy();
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('3.64 + 3.65 Ручная выдача — валидация', async () => {
    const admin = await newAdminContext();
    const cases: Array<[any, number]> = [
      [{}, 400],
      [{ userId: 'a' }, 400],
      [{ planId: 'b' }, 400],
      [{ userId: 'no-such', planId: 'no-such' }, 404],
    ];
    for (const [data, code] of cases) {
      const r = await admin.post('/api/admin/purchases', { data });
      expect(r.status(), JSON.stringify(data)).toBe(code);
    }
    await admin.dispose();
  });

  test('3.66 Продление подписки', async () => {
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
      const purchase = (await buy.json()).purchase;
      const before = new Date(purchase.expiresAt).getTime();

      const r = await admin.patch(`/api/admin/purchases/${purchase.id}`, {
        data: { extendDays: 30 },
      });
      expect(r.ok()).toBeTruthy();
      const after = new Date((await r.json()).purchase.expiresAt).getTime();
      expect(after - before).toBeGreaterThan(29 * 24 * 60 * 60 * 1000);
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('3.67 makeUnlimited', async () => {
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
      const r = await admin.patch(`/api/admin/purchases/${purchaseId}`, {
        data: { makeUnlimited: true },
      });
      expect(r.ok()).toBeTruthy();
      const body = await r.json();
      expect(body.purchase.expiresAt).toBeNull();
      expect(body.purchase.status).toBe('ACTIVE');
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('3.68 Изменение статуса CANCELLED → доступ закрыт', async () => {
    const admin = await newAdminContext();
    const { course, plan, paidLesson } = await createFullCourse(admin);
    const { user, ctx } = await newUserContext();
    try {
      // даём доступ + грузим локальное видео
      const list = await admin.get(
        `/api/admin/students?q=${encodeURIComponent(user.email.split('@')[0])}`,
      );
      const userId = (await list.json()).students[0].id;
      const buy = await admin.post('/api/admin/purchases', {
        data: { userId, planId: plan.id },
      });
      const purchaseId = (await buy.json()).purchase.id;

      await uploadVideoFixtureAPI(admin, paidLesson.id);

      // до отмены — доступ есть
      const ok = await ctx.get(`/api/lessons/${paidLesson.id}/video`);
      expect([200, 206]).toContain(ok.status());

      const r = await admin.patch(`/api/admin/purchases/${purchaseId}`, {
        data: { status: 'CANCELLED' },
      });
      expect(r.ok()).toBeTruthy();

      const denied = await ctx.get(`/api/lessons/${paidLesson.id}/video`);
      expect(denied.status()).toBe(403);
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('3.69 PATCH без полей → 400', async () => {
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
      const r = await admin.patch(`/api/admin/purchases/${purchaseId}`, { data: {} });
      expect(r.status()).toBe(400);
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('3.70 DELETE покупки — мягкое (CANCELLED)', async () => {
    const admin = await newAdminContext();
    const { course, plan, paidLesson } = await createFullCourse(admin);
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

      await uploadVideoFixtureAPI(admin, paidLesson.id);

      const del = await admin.delete(`/api/admin/purchases/${purchaseId}`);
      expect(del.ok()).toBeTruthy();
      // запись осталась со status:CANCELLED — проверяем через /api/admin/students/:id
      const stu = await admin.get(`/api/admin/students/${userId}`);
      const body = await stu.json();
      const found = body.purchases.find((p: any) => p.id === purchaseId);
      expect(found).toBeTruthy();
      expect(found.status).toBe('CANCELLED');

      // студенту видео — 403
      const v = await ctx.get(`/api/lessons/${paidLesson.id}/video`);
      expect(v.status()).toBe(403);
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });
});
