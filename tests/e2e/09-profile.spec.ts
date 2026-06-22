import { test, expect } from '@playwright/test';
import {
  newUserContext,
  newGuestContext,
  registerAPI,
  loginAPI,
  newUser,
  registerViaUI,
} from './helpers';

test.describe('Часть II: Профиль и аккаунт', () => {
  test('2.1 GET /api/me сразу после регистрации', async () => {
    const u = newUser('me');
    const ctx = await newGuestContext();
    const created = await registerAPI(ctx, u);
    const r = await ctx.get('/api/me');
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(body.user.email).toBe(u.email.toLowerCase());
    expect(body.user.name).toBe(u.name);
    expect(body.user.id).toBe(created.id);
    expect(Array.isArray(body.purchases)).toBe(true);
    expect(Array.isArray(body.progress)).toBe(true);
    expect(Array.isArray(body.lastLessons)).toBe(true);
    await ctx.dispose();
  });

  test('2.2 PATCH имени', async () => {
    const { ctx } = await newUserContext();
    const r = await ctx.patch('/api/me/profile', { data: { name: 'New Name PW' } });
    expect(r.ok()).toBeTruthy();
    const me = await ctx.get('/api/me');
    expect((await me.json()).user.name).toBe('New Name PW');
    await ctx.dispose();
  });

  test('2.3 PATCH с пустым телом → 400', async () => {
    const { ctx } = await newUserContext();
    const r = await ctx.patch('/api/me/profile', { data: {} });
    expect(r.status()).toBe(400);
    await ctx.dispose();
  });

  test('2.4 PATCH с whitespace-only name → 400', async () => {
    const { ctx } = await newUserContext();
    const r = await ctx.patch('/api/me/profile', { data: { name: '   ' } });
    expect(r.status()).toBe(400);
    await ctx.dispose();
  });

  test('2.5 Смена пароля API → перелогин', async () => {
    const u = newUser('pwch');
    const ctx = await newGuestContext();
    await registerAPI(ctx, u);
    const r = await ctx.post('/api/me/profile', {
      data: { currentPassword: u.password, newPassword: 'NewPass123!' },
    });
    expect(r.ok(), `change → ${r.status()}`).toBeTruthy();
    await ctx.post('/api/auth/logout');
    await ctx.dispose();

    const c2 = await newGuestContext();
    const oldLogin = await c2.post('/api/auth/login', {
      data: { email: u.email, password: u.password },
    });
    expect(oldLogin.status()).toBe(401);
    await loginAPI(c2, { ...u, password: 'NewPass123!' });
    await c2.dispose();
  });

  test('2.6 Смена пароля — неверный текущий → 401', async () => {
    const { ctx } = await newUserContext();
    const r = await ctx.post('/api/me/profile', {
      data: { currentPassword: 'wrong', newPassword: 'NewPass123!' },
    });
    expect(r.status()).toBe(401);
    await ctx.dispose();
  });

  test('2.7 Смена пароля — слабый новый → 400', async () => {
    const { user, ctx } = await newUserContext();
    const r = await ctx.post('/api/me/profile', {
      data: { currentPassword: user.password, newPassword: '123' },
    });
    expect(r.status()).toBe(400);
    await ctx.dispose();
  });

  test('2.8 Смена пароля через UI /profile/edit', async ({ page }) => {
    const u = newUser('pwui');
    await registerViaUI(page, u);
    await page.goto('/profile/edit');

    await page.locator('input#cur').fill(u.password);
    await page.locator('input#new').fill('NewerPass1!');
    await page.locator('input#confirm').fill('NewerPass1!');

    const passwordForm = page.locator('form').filter({ has: page.locator('input#new') });
    await passwordForm.getByRole('button', { name: /Изменить пароль|Сохранение/ }).click();

    // Ждём успеха
    await expect(page.getByText(/Пароль обновлён/)).toBeVisible({ timeout: 10_000 });

    // Перелогин с новым
    const c2 = await newGuestContext();
    await loginAPI(c2, { ...u, password: 'NewerPass1!' });
    await c2.dispose();
  });

  test('2.46 Logout', async () => {
    const { ctx } = await newUserContext();
    const out = await ctx.post('/api/auth/logout');
    expect(out.ok()).toBeTruthy();
    const me = await ctx.get('/api/me');
    expect(me.status()).toBe(401);
    await ctx.dispose();
  });

  test('2.48 Profile edit UI — меняем имя', async ({ page }) => {
    const u = newUser('edituname');
    await registerViaUI(page, u);
    await page.goto('/profile/edit');

    await page.locator('input#name').fill('Renamed Test');
    const nameForm = page.locator('form').filter({ has: page.locator('input#name') });
    await nameForm.getByRole('button', { name: /Сохранить имя|Сохранение/ }).click();

    await expect(page.getByText(/Имя обновлено/)).toBeVisible({ timeout: 10_000 });

    await page.goto('/profile');
    // имя появляется в шапке и в карточке профиля — берём первое
    await expect(page.getByText('Renamed Test').first()).toBeVisible({ timeout: 10_000 });
  });

  test('2.49 Студент не может ходить в /api/admin/*', async () => {
    const { ctx } = await newUserContext();
    const cases: Array<[string, string, any?]> = [
      ['GET', '/api/admin/courses'],
      ['POST', '/api/admin/courses', { slug: 'x', title: 'x' }],
      ['GET', '/api/admin/students'],
    ];
    for (const [method, path, data] of cases) {
      const r = await ctx.fetch(path, { method, data });
      expect(r.status(), `${method} ${path}`).toBe(401);
    }
    await ctx.dispose();
  });

  test('2.50 Студент с user-cookie на /admin → /admin/login', async ({ page }) => {
    const u = newUser('stu-admin');
    await registerViaUI(page, u);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
