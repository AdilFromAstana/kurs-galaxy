import { test, expect } from '@playwright/test';
import {
  newAdminContext,
  newGuestContext,
  createCourseAPI,
  publishCourseAPI,
  createPlanAPI,
  deleteCourseAPI,
} from './helpers';

test.describe('Часть III: Тарифы', () => {
  test('3.49 Создание ONE_MONTH → accessDays=30', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    try {
      const r = await admin.post(`/api/admin/courses/${c.id}/pricing`, {
        data: {
          name: 'Базовый',
          accessPeriod: 'ONE_MONTH',
          price: 1000,
          currency: 'KZT',
        },
      });
      expect(r.ok()).toBeTruthy();
      const body = await r.json();
      expect(body.plan.accessDays).toBe(30);
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.50 UNLIMITED → accessDays=null', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    try {
      const plan = await createPlanAPI(admin, c.id, {
        name: 'Безлимит',
        accessPeriod: 'UNLIMITED',
        price: 5000,
      });
      expect(plan.accessDays).toBeNull();
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.51 + 3.52 Невалидные значения → 400', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    try {
      const r1 = await admin.post(`/api/admin/courses/${c.id}/pricing`, {
        data: { name: 'X', price: -1, accessPeriod: 'ONE_MONTH' },
      });
      expect(r1.status()).toBe(400);

      const r2 = await admin.post(`/api/admin/courses/${c.id}/pricing`, {
        data: { name: 'X', price: 'abc', accessPeriod: 'ONE_MONTH' },
      });
      expect(r2.status()).toBe(400);

      // без name
      const r3 = await admin.post(`/api/admin/courses/${c.id}/pricing`, {
        data: { price: 100, accessPeriod: 'ONE_MONTH' },
      });
      expect(r3.status()).toBe(400);
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.53 + 3.54 PATCH тарифа', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    try {
      const plan = await createPlanAPI(admin, c.id, {
        name: 'P',
        accessPeriod: 'ONE_MONTH',
        price: 1000,
      });

      const r1 = await admin.patch(`/api/admin/pricing/${plan.id}`, {
        data: { price: 1500, isRecommended: true },
      });
      expect(r1.ok()).toBeTruthy();
      const body1 = await r1.json();
      expect(body1.plan.price).toBe(1500);
      expect(body1.plan.isRecommended).toBe(true);

      const r2 = await admin.patch(`/api/admin/pricing/${plan.id}`, {
        data: { accessPeriod: 'SIX_MONTHS' },
      });
      expect(r2.ok()).toBeTruthy();
      expect((await r2.json()).plan.accessDays).toBe(180);
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.55 isActive=false скрывает в публичном API', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    await publishCourseAPI(admin, c.id);
    try {
      const plan = await createPlanAPI(admin, c.id, {
        name: 'HiddenPlan',
        accessPeriod: 'ONE_MONTH',
        price: 1000,
      });

      const guest = await newGuestContext();
      const before = await guest.get(`/api/courses/${c.slug}`);
      const beforeBody = await before.json();
      expect(
        beforeBody.course.pricingPlans.some((p: any) => p.id === plan.id),
      ).toBe(true);

      await admin.patch(`/api/admin/pricing/${plan.id}`, {
        data: { isActive: false },
      });

      const after = await guest.get(`/api/courses/${c.slug}`);
      const afterBody = await after.json();
      expect(
        afterBody.course.pricingPlans.some((p: any) => p.id === plan.id),
      ).toBe(false);
      await guest.dispose();
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });

  test('3.56 DELETE тарифа', async () => {
    const admin = await newAdminContext();
    const c = await createCourseAPI(admin);
    try {
      const plan = await createPlanAPI(admin, c.id, {
        name: 'P',
        accessPeriod: 'ONE_MONTH',
        price: 1000,
      });
      const del = await admin.delete(`/api/admin/pricing/${plan.id}`);
      expect(del.ok()).toBeTruthy();
    } finally {
      await deleteCourseAPI(admin, c.id);
      await admin.dispose();
    }
  });
});
