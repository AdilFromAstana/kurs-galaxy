import { test, expect } from '@playwright/test';
import {
  newUser,
  registerAPI,
  newGuestContext,
  getResetTokenForUser,
  setResetTokenExpired,
  loginAPI,
  disconnectPrisma,
} from './helpers';

test.describe('Часть I: Сброс пароля', () => {
  test.afterAll(async () => {
    await disconnectPrisma();
  });

  test('1.18 Forgot — несуществующий email → 200', async ({ request }) => {
    const res = await request.post('/api/auth/request-reset', {
      data: { email: `no-user-${Date.now()}@test.local` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('1.18b Forgot — пустой email → 400', async ({ request }) => {
    const res = await request.post('/api/auth/request-reset', { data: {} });
    expect(res.status()).toBe(400);
  });

  test('1.19 Forgot → reset → login новым паролем', async ({ page }) => {
    const u = newUser('reset');
    const ctx = await newGuestContext();
    await registerAPI(ctx, u);
    await ctx.post('/api/auth/logout');

    const r1 = await ctx.post('/api/auth/request-reset', { data: { email: u.email } });
    expect(r1.ok()).toBeTruthy();

    const token = await getResetTokenForUser(u.email);
    expect(token, 'reset token saved in DB').toBeTruthy();

    await page.context().clearCookies();
    await page.goto(`/auth/reset?token=${token}`);
    const newPassword = 'Reset123!';
    await page.getByLabel('Новый пароль').fill(newPassword);
    await page.getByLabel('Подтверждение').fill(newPassword);
    await page.getByRole('button', { name: /Сменить пароль|Сохраняем/ }).click();
    await expect(page.getByText(/Пароль обновлён/)).toBeVisible();

    // Логинимся новым через API (быстрее чем UI), проверяем что пароль сменился
    const ctx2 = await newGuestContext();
    await loginAPI(ctx2, { ...u, password: newPassword });
    const me = await ctx2.get('/api/me');
    expect(me.ok()).toBeTruthy();
    await ctx.dispose();
    await ctx2.dispose();
  });

  test('1.20 Reset — невалидный токен → 400', async ({ request }) => {
    const res = await request.post('/api/auth/reset', {
      data: { token: 'fake-token-' + Date.now(), newPassword: 'Whatever1' },
    });
    expect(res.status()).toBe(400);
  });

  test('1.21 Reset — короткий пароль → 400', async ({ request }) => {
    const u = newUser('short-reset');
    const ctx = await newGuestContext();
    await registerAPI(ctx, u);
    await ctx.post('/api/auth/logout');
    await ctx.post('/api/auth/request-reset', { data: { email: u.email } });
    const token = await getResetTokenForUser(u.email);
    const res = await request.post('/api/auth/reset', {
      data: { token, newPassword: '123' },
    });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('1.22 Reset — повторное использование токена → 400', async ({ request }) => {
    const u = newUser('reuse-reset');
    const ctx = await newGuestContext();
    await registerAPI(ctx, u);
    await ctx.post('/api/auth/logout');
    await ctx.post('/api/auth/request-reset', { data: { email: u.email } });
    const token = await getResetTokenForUser(u.email);

    const ok = await request.post('/api/auth/reset', {
      data: { token, newPassword: 'GoodPass1!' },
    });
    expect(ok.ok()).toBeTruthy();

    const reuse = await request.post('/api/auth/reset', {
      data: { token, newPassword: 'AnotherPass1!' },
    });
    expect(reuse.status()).toBe(400);
    await ctx.dispose();
  });

  test('1.23 Reset — токен старше 1 часа → 400', async ({ request }) => {
    const u = newUser('old-reset');
    const ctx = await newGuestContext();
    await registerAPI(ctx, u);
    await ctx.post('/api/auth/logout');
    await ctx.post('/api/auth/request-reset', { data: { email: u.email } });
    const token = await getResetTokenForUser(u.email);
    await setResetTokenExpired(u.email);

    const res = await request.post('/api/auth/reset', {
      data: { token, newPassword: 'GoodPass1!' },
    });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });
});
