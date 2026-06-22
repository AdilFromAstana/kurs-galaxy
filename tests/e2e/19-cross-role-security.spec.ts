import { test, expect } from '@playwright/test';
import {
  newAdminContext,
  newUserContext,
  newGuestContext,
  createFullCourse,
  deleteCourseAPI,
  completeAllLessons,
  uploadVideoFixtureAPI,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} from './helpers';

test.describe('Часть IV: Кросс-роль и безопасность', () => {
  test('4.1 Гость не может POST/PATCH/DELETE в admin-роуты', async () => {
    const guest = await newGuestContext();
    const cases: Array<[string, string, any?]> = [
      ['POST', '/api/admin/courses', { slug: 'x', title: 'x' }],
      ['PATCH', '/api/admin/courses/some-id', { title: 'x' }],
      ['DELETE', '/api/admin/courses/some-id'],
      ['POST', '/api/admin/purchases', { userId: 'u', planId: 'p' }],
      ['PATCH', '/api/admin/purchases/some-id', { extendDays: 1 }],
      ['DELETE', '/api/admin/purchases/some-id'],
    ];
    for (const [method, path, data] of cases) {
      const r = await guest.fetch(path, { method, data });
      expect(r.status(), `${method} ${path}`).toBe(401);
    }
    await guest.dispose();
  });

  test('4.2 Студент не может в admin-роуты', async () => {
    const { ctx } = await newUserContext();
    const cases: Array<[string, string, any?]> = [
      ['GET', '/api/admin/courses'],
      ['POST', '/api/admin/courses', { slug: 'x', title: 'x' }],
      ['GET', '/api/admin/students'],
      ['POST', '/api/admin/purchases', { userId: 'u', planId: 'p' }],
      ['GET', '/api/admin/me'],
    ];
    for (const [method, path, data] of cases) {
      const r = await ctx.fetch(path, { method, data });
      expect(r.status(), `${method} ${path}`).toBe(401);
    }
    await ctx.dispose();
  });

  test('4.3 Админ-cookie не имеет доступа к user /api/me', async () => {
    const admin = await newAdminContext();
    const r = await admin.get('/api/me');
    expect(r.status()).toBe(401);
    await admin.dispose();
  });

  test('4.4 u2 не видит сертификат u1', async () => {
    const admin = await newAdminContext();
    const { course, plan } = await createFullCourse(admin);
    const { ctx: c1 } = await newUserContext();
    const { ctx: c2 } = await newUserContext();
    try {
      // u1: покупка + полное прохождение
      await c1.post('/api/purchases', { data: { planId: plan.id } });
      await completeAllLessons(c1, course.id);
      const ok = await c1.get(`/api/courses/${course.id}/certificate`);
      expect(ok.ok()).toBeTruthy();

      // u2: купил, но не прошёл — должен получить not_completed
      await c2.post('/api/purchases', { data: { planId: plan.id } });
      const r = await c2.get(`/api/courses/${course.id}/certificate`);
      expect(r.status()).toBe(403);
      expect((await r.json()).error).toBe('not_completed');
    } finally {
      await c1.dispose();
      await c2.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('4.5 Студент не видит чужие purchase через /api/me', async () => {
    const admin = await newAdminContext();
    const { course, plan } = await createFullCourse(admin);
    const { ctx: c1 } = await newUserContext();
    const { ctx: c2 } = await newUserContext();
    try {
      const buy = await c1.post('/api/purchases', { data: { planId: plan.id } });
      const purchase1 = (await buy.json()).purchase;

      const me2 = await c2.get('/api/me');
      const body = await me2.json();
      expect(body.purchases.find((p: any) => p.id === purchase1.id)).toBeFalsy();

      const list2 = await c2.get('/api/purchases');
      const lbody = await list2.json();
      expect(lbody.purchases.find((p: any) => p.id === purchase1.id)).toBeFalsy();
    } finally {
      await c1.dispose();
      await c2.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('4.6 Прямой доступ к /uploads/lessons/* без сессии', async () => {
    const admin = await newAdminContext();
    const { course, paidLesson } = await createFullCourse(admin);
    try {
      const up = await uploadVideoFixtureAPI(admin, paidLesson.id);
      const guest = await newGuestContext();
      const r = await guest.get(up.videoUrl);
      // Next.js не отдаёт /uploads/* статикой — ждём 404 (или 403/401)
      expect([401, 403, 404]).toContain(r.status());
      await guest.dispose();
    } finally {
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('4.7 Подмена admin-cookie мусором → 401', async () => {
    const ctx = await newGuestContext();
    const r = await ctx.get('/api/admin/courses', {
      headers: { cookie: 'nail_admin_session=GARBAGE' },
    });
    expect(r.status()).toBe(401);
    await ctx.dispose();
  });

  test('4.8 SQL-подобный поиск студентов не падает', async () => {
    const admin = await newAdminContext();
    const r = await admin.get(`/api/admin/students?q=${encodeURIComponent(`' OR 1=1 --`)}`);
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(Array.isArray(body.students)).toBe(true);
    await admin.dispose();
  });

  test('4.9 Path traversal в videoUrl не работает', async () => {
    const admin = await newAdminContext();
    const { course, paidLesson } = await createFullCourse(admin);
    try {
      await admin.patch(`/api/admin/lessons/${paidLesson.id}`, {
        data: { isFree: true, videoUrl: '/uploads/lessons/../../../etc/passwd' },
      });
      const r = await admin.get(`/api/lessons/${paidLesson.id}/video`);
      // ожидаем 400 invalid_path или 404 file_missing
      expect([400, 404]).toContain(r.status());
    } finally {
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('4.10 Race на покупку — одна 200, остальные 409', async () => {
    const admin = await newAdminContext();
    const { course, plan } = await createFullCourse(admin);
    const { ctx } = await newUserContext();
    try {
      const results = await Promise.all([
        ctx.post('/api/purchases', { data: { planId: plan.id } }),
        ctx.post('/api/purchases', { data: { planId: plan.id } }),
        ctx.post('/api/purchases', { data: { planId: plan.id } }),
      ]);
      const oks = results.filter((r) => r.status() === 200).length;
      const conflicts = results.filter((r) => r.status() === 409).length;
      expect(oks).toBe(1);
      expect(conflicts).toBe(2);

      // У юзера ровно одна active-покупка этого курса.
      const me = await ctx.get('/api/me');
      const body = await me.json();
      const active = body.purchases.filter(
        (p: any) => p.courseId === course.id && p.status === 'ACTIVE',
      );
      expect(active.length).toBe(1);
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('4.11 Rate-limit логина: 11-я попытка → 429', async () => {
    const ctx = await newGuestContext();
    const email = `rl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.local`;
    // 10 неудачных попыток подряд — все 401
    for (let i = 0; i < 10; i++) {
      const r = await ctx.post('/api/auth/login', {
        data: { email, password: 'wrong' },
      });
      expect(r.status(), `attempt ${i + 1}`).toBe(401);
    }
    // 11-я — 429
    const r = await ctx.post('/api/auth/login', {
      data: { email, password: 'wrong' },
    });
    expect(r.status()).toBe(429);
    expect(r.headers()['retry-after']).toBeTruthy();
    await ctx.dispose();
  });

  test('4.12 Rate-limit reset: 4-й запрос → 429', async () => {
    const ctx = await newGuestContext();
    const email = `rl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.local`;
    for (let i = 0; i < 3; i++) {
      const r = await ctx.post('/api/auth/request-reset', { data: { email } });
      expect(r.ok(), `attempt ${i + 1}`).toBeTruthy();
    }
    const r = await ctx.post('/api/auth/request-reset', { data: { email } });
    expect(r.status()).toBe(429);
    await ctx.dispose();
  });

  test('4.13 Progress на платный без покупки → 403', async () => {
    const admin = await newAdminContext();
    const { course, paidLesson } = await createFullCourse(admin);
    const { ctx } = await newUserContext();
    try {
      const r = await ctx.post('/api/progress', { data: { lessonId: paidLesson.id } });
      expect(r.status()).toBe(403);
      const body = await r.json().catch(() => ({}));
      expect(body.error).toBe('no_access');
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });
});
