import { test, expect } from '@playwright/test';
import {
  newUser,
  registerViaUI,
  loginViaUI,
  logoutViaUI,
  registerAPI,
  newGuestContext,
} from './helpers';

test.describe('Часть I: Регистрация и логин', () => {
  test('1.8 Регистрация валидная (UI)', async ({ page }) => {
    await registerViaUI(page, newUser('reg'));
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Мои курсы' })).toBeVisible();
  });

  test('1.9 Регистрация с занятым email', async ({ page, request }) => {
    const u = newUser('dup');
    await registerAPI(request, u);
    await page.context().clearCookies();
    await page.goto('/auth/register');
    await page.getByLabel('Ваше имя').fill(u.name);
    await page.getByLabel('Email').fill(u.email);
    await page.getByLabel('Пароль').fill(u.password);
    await page.getByRole('button', { name: /Зарегистрироваться|Регистрируем/ }).click();
    await expect(page.getByText(/уже существует/i)).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('1.10 Регистрация — все пустые', async ({ request }) => {
    const res = await request.post('/api/auth/register', { data: {} });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/обязательны|required/i);
  });

  test('1.11 Регистрация — пароль < 6', async ({ request }) => {
    const u = newUser('short');
    const res = await request.post('/api/auth/register', {
      data: { name: u.name, email: u.email, password: '12345' },
    });
    expect(res.status()).toBe(400);
  });

  test('1.12 Регистрация — email приводится к lower-case', async ({ request }) => {
    // Текущий код не валидирует формат строго. Регистрация UPPER → email хранится lower.
    const u = newUser('case');
    const upper = { ...u, email: u.email.toUpperCase() };
    const res = await request.post('/api/auth/register', { data: upper });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.user.email).toBe(u.email.toLowerCase());
  });

  test('1.13 Логин — happy path (UI)', async ({ page }) => {
    const u = newUser('relog');
    await registerViaUI(page, u);
    await logoutViaUI(page);
    await loginViaUI(page, u);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('1.14 Логин — неверный пароль (UI)', async ({ page }) => {
    const u = newUser('badpw');
    await registerViaUI(page, u);
    await logoutViaUI(page);
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill(u.email);
    await page.getByLabel('Пароль').fill('wrong-password');
    await page.getByRole('button', { name: /Войти|Входим/ }).click();
    await expect(page.getByText(/Неверный email или пароль/i)).toBeVisible();
  });

  test('1.15 Логин — несуществующий email', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'no-such-' + Date.now() + '@x.test', password: 'whatever' },
    });
    expect(res.status()).toBe(401);
  });

  test('1.16 Логин — пустые поля', async ({ request }) => {
    const res = await request.post('/api/auth/login', { data: {} });
    expect(res.status()).toBe(400);
  });

  test('1.17 Logout очищает сессию', async ({ request }) => {
    const u = newUser('logout');
    const ctx = await newGuestContext();
    await registerAPI(ctx, u);
    const meBefore = await ctx.get('/api/me');
    expect(meBefore.ok()).toBeTruthy();

    const out = await ctx.post('/api/auth/logout');
    expect(out.ok()).toBeTruthy();

    const meAfter = await ctx.get('/api/me');
    expect(meAfter.status()).toBe(401);
    await ctx.dispose();
  });
});
