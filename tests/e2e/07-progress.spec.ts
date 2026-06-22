import { test, expect } from '@playwright/test';
import {
  newAdminContext,
  newUserContext,
  createFullCourse,
  deleteCourseAPI,
  registerViaUI,
  newUser,
} from './helpers';

test.describe('Часть II: Прогресс и видео-позиция', () => {
  test('2.27 + 2.28 POST /api/progress happy + идемпотентность', async () => {
    const admin = await newAdminContext();
    const { course, freeLesson } = await createFullCourse(admin);
    const { ctx } = await newUserContext();
    try {
      const r1 = await ctx.post('/api/progress', { data: { lessonId: freeLesson.id } });
      expect(r1.ok()).toBeTruthy();

      const me1 = await ctx.get('/api/me');
      const body1 = await me1.json();
      const matches1 = body1.progress.filter((p: any) => p.lessonId === freeLesson.id);
      expect(matches1.length).toBe(1);
      expect(matches1[0].courseId).toBe(course.id);
      expect(body1.lastLessons.some((l: any) => l.lessonId === freeLesson.id)).toBe(true);

      // повторный POST — идемпотентен
      const r2 = await ctx.post('/api/progress', { data: { lessonId: freeLesson.id } });
      expect(r2.ok()).toBeTruthy();
      const me2 = await ctx.get('/api/me');
      const body2 = await me2.json();
      const matches2 = body2.progress.filter((p: any) => p.lessonId === freeLesson.id);
      expect(matches2.length).toBe(1);
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.29 POST /api/progress несуществующий урок → 404', async () => {
    const { ctx } = await newUserContext();
    const r = await ctx.post('/api/progress', { data: { lessonId: 'no-such-lesson' } });
    expect(r.status()).toBe(404);
    await ctx.dispose();
  });

  test('2.30 POST /api/progress без lessonId → 400', async () => {
    const { ctx } = await newUserContext();
    const r = await ctx.post('/api/progress', { data: {} });
    expect(r.status()).toBe(400);
    await ctx.dispose();
  });

  test('2.31 GET /api/progress?courseId фильтрует', async () => {
    const admin = await newAdminContext();
    const a = await createFullCourse(admin);
    const b = await createFullCourse(admin);
    const { ctx } = await newUserContext();
    try {
      await ctx.post('/api/progress', { data: { lessonId: a.freeLesson.id } });
      await ctx.post('/api/progress', { data: { lessonId: b.freeLesson.id } });

      const r = await ctx.get(`/api/progress?courseId=${a.course.id}`);
      expect(r.ok()).toBeTruthy();
      const body = await r.json();
      const arr = body.progress as Array<{ courseId: string }>;
      expect(arr.length).toBeGreaterThan(0);
      for (const p of arr) expect(p.courseId).toBe(a.course.id);
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, a.course.id);
      await deleteCourseAPI(admin, b.course.id);
      await admin.dispose();
    }
  });

  test('2.32 POST /api/last-lesson обновляет lastLesson', async () => {
    const admin = await newAdminContext();
    const { course, freeLesson, paidLesson } = await createFullCourse(admin);
    const { ctx } = await newUserContext();
    try {
      await ctx.post('/api/last-lesson', { data: { lessonId: freeLesson.id } });
      await ctx.post('/api/last-lesson', { data: { lessonId: paidLesson.id } });
      const me = await ctx.get('/api/me');
      const body = await me.json();
      const last = body.lastLessons.find((l: any) => l.courseId === course.id);
      expect(last).toBeTruthy();
      expect(last.lessonId).toBe(paidLesson.id);
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.33 POST /api/last-lesson на странице урока (UI)', async ({ page }) => {
    const admin = await newAdminContext();
    const { course, freeLesson } = await createFullCourse(admin);
    const u = newUser('lastles');
    await registerViaUI(page, u);

    const respPromise = page.waitForResponse(
      (r) => r.url().includes('/api/last-lesson') && r.request().method() === 'POST' && r.ok(),
      { timeout: 15_000 },
    );
    await page.goto(`/lesson/${freeLesson.id}`);
    await respPromise;

    const me = await page.request.get('/api/me');
    const body = await me.json();
    expect(body.lastLessons.some((l: any) => l.lessonId === freeLesson.id)).toBe(true);

    await deleteCourseAPI(admin, course.id);
    await admin.dispose();
  });

  test('2.34 + 2.35 POST /api/video-position сохраняет и обновляет', async () => {
    const admin = await newAdminContext();
    const { course, freeLesson } = await createFullCourse(admin);
    const { ctx } = await newUserContext();
    try {
      const a = await ctx.post('/api/video-position', {
        data: { lessonId: freeLesson.id, time: 42.5 },
      });
      expect(a.ok()).toBeTruthy();
      const g1 = await ctx.get(`/api/video-position?lessonId=${freeLesson.id}`);
      expect((await g1.json()).time).toBe(42.5);

      const b = await ctx.post('/api/video-position', {
        data: { lessonId: freeLesson.id, time: 99 },
      });
      expect(b.ok()).toBeTruthy();
      const g2 = await ctx.get(`/api/video-position?lessonId=${freeLesson.id}`);
      expect((await g2.json()).time).toBe(99);
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.36 POST /api/video-position невалидный time → 400', async () => {
    const admin = await newAdminContext();
    const { course, freeLesson } = await createFullCourse(admin);
    const { ctx } = await newUserContext();
    try {
      const r = await ctx.post('/api/video-position', {
        data: { lessonId: freeLesson.id, time: 'abc' },
      });
      expect(r.status()).toBe(400);
    } finally {
      await ctx.dispose();
      await deleteCourseAPI(admin, course.id);
      await admin.dispose();
    }
  });

  test('2.37 GET /api/video-position без lessonId → 400', async () => {
    const { ctx } = await newUserContext();
    const r = await ctx.get('/api/video-position');
    expect(r.status()).toBe(400);
    await ctx.dispose();
  });
});
