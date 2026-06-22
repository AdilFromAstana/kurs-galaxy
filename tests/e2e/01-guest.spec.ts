import { test, expect } from '@playwright/test';
import {
  fetchCourses,
  newAdminContext,
  createCourseAPI,
  deleteCourseAPI,
  newGuestContext,
  registerViaUI,
  newUser,
} from './helpers';

test.describe('Часть I: Гость', () => {
  test('1.1 Лендинг показывает CTA', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'KursGalaxy.kz' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Посмотреть курсы|Смотреть все курсы/ }).first(),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Войти' }).first()).toBeVisible();
  });

  test('1.2 Каталог открыт без сессии', async ({ page, request }) => {
    await page.context().clearCookies();
    const courses = await fetchCourses(request);
    expect(courses.length).toBeGreaterThan(0);
    await page.goto('/courses');
    await expect(page.getByRole('heading', { name: 'Каталог курсов' })).toBeVisible();
    await expect(page.getByText(courses[0].title).first()).toBeVisible();
  });

  test('1.3 Страница курса (slug) без сессии', async ({ page, request }) => {
    await page.context().clearCookies();
    const courses = await fetchCourses(request);
    const c = courses[0];
    await page.goto(`/course/${c.slug}`);
    await expect(page.getByRole('heading', { name: c.title })).toBeVisible();
    await expect(page.getByText('Программа курса')).toBeVisible();
    await expect(page.getByText(/Доступные тарифы|Выберите тарифный план/)).toBeVisible();
  });

  test('1.4 Страница курса по id (без сессии)', async ({ request }) => {
    const courses = await fetchCourses(request);
    const c = courses[0];
    const res = await request.get(`/api/courses/${c.id}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.course.slug).toBe(c.slug);
  });

  test('1.5 Черновик курса не доступен гостю', async ({ page }) => {
    const admin = await newAdminContext();
    const draft = await createCourseAPI(admin);
    try {
      const guest = await newGuestContext();
      const res = await guest.get(`/api/courses/${draft.slug}`);
      expect(res.status()).toBe(404);
      const body = await res.json().catch(() => ({}));
      expect(body.error).toBe('not_found');
      await guest.dispose();

      await page.context().clearCookies();
      await page.goto(`/course/${draft.slug}`);
      // Страница рендерит "Курс не найден" или показывает 404 — главное, не контент.
      await expect(page.getByRole('heading', { name: draft.title })).toHaveCount(0);
    } finally {
      await deleteCourseAPI(admin, draft.id);
      await admin.dispose();
    }
  });

  test('1.6 Middleware защищает приватные роуты (user)', async ({ page }) => {
    // /lesson НЕ в списке: бесплатные уроки доступны гостям
    for (const path of ['/dashboard', '/profile', '/profile/edit']) {
      await page.context().clearCookies();
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth\/login/);
    }
  });

  test('1.6b Middleware защищает /admin/*', async ({ page }) => {
    for (const path of ['/admin', '/admin/courses']) {
      await page.context().clearCookies();
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login/);
    }
  });

  test('1.7 Покупка с лендинга редиректит на регистрацию', async ({ page, request }) => {
    await page.context().clearCookies();
    const courses = await fetchCourses(request);
    expect(courses.length).toBeGreaterThan(0);
    await page.goto('/courses');
    // ловим первую кнопку "Купить" (точное совпадение, чтобы не задеть "Купить полный доступ")
    const buyBtn = page.getByRole('button', { name: 'Купить', exact: true }).first();
    await expect(buyBtn).toBeVisible();
    await buyBtn.click();
    await page.waitForURL(/\/auth\/register\?course=/, { timeout: 10_000 });
    expect(page.url()).toContain('/auth/register?course=');
  });

  test('1.27 Гость с активной сессией редиректится с / на /dashboard', async ({ page }) => {
    await page.context().clearCookies();
    await registerViaUI(page, newUser('redir'));
    await page.goto('/');
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
