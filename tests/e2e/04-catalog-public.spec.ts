import { test, expect } from '@playwright/test';
import { fetchCourses, newGuestContext } from './helpers';

test.describe('Часть I: Каталог и гостевой доступ к API', () => {
  test('1.24 Гость не может работать с защищёнными API', async () => {
    const ctx = await newGuestContext();

    const cases: Array<[string, string, any?]> = [
      ['GET', '/api/me'],
      ['PATCH', '/api/me/profile', { name: 'x' }],
      ['POST', '/api/me/profile', { currentPassword: 'x', newPassword: 'yyyyyy' }],
      ['POST', '/api/purchases', { planId: 'fake' }],
      ['GET', '/api/purchases'],
      ['POST', '/api/progress', { lessonId: 'fake' }],
      ['GET', '/api/progress'],
      ['POST', '/api/last-lesson', { lessonId: 'fake' }],
      ['GET', '/api/video-position?lessonId=fake'],
      ['POST', '/api/video-position', { lessonId: 'fake', time: 1 }],
      // /api/lessons/:id/video проверяет lesson ДО auth (404 на фейковый id);
      // 401 на этом роуте проверяется в 06-lesson-access.
      ['GET', '/api/courses/some-id/certificate'],
      ['GET', '/api/admin/courses'],
      ['POST', '/api/admin/courses', { slug: 'x', title: 'x' }],
      ['GET', '/api/admin/students'],
      ['GET', '/api/admin/me'],
    ];

    for (const [method, path, data] of cases) {
      const res = await ctx.fetch(path, { method, data });
      expect(
        res.status(),
        `${method} ${path} → expected 401 got ${res.status()}`,
      ).toBe(401);
    }
    await ctx.dispose();
  });

  test('1.26 Верификация несуществующего сертификата (UI)', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/cert/verify/INVALID-CERT-ID');
    await expect(page.getByText(/Сертификат не найден/)).toBeVisible();
  });

  test('Public /api/courses содержит только published', async ({ request }) => {
    const courses = await fetchCourses(request);
    for (const c of courses) {
      expect(c.published).toBe(true);
    }
  });
});
