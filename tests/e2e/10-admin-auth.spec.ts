import { test, expect } from '@playwright/test';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  adminLoginUI,
  adminLoginAPI,
  newGuestContext,
  newAdminContext,
} from './helpers';

test.describe('Часть III: Аутентификация админа', () => {
  test('3.1 Гость на /admin редиректится', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('3.2 Логин админом UI', async ({ page }) => {
    await adminLoginUI(page);
    await expect(page).toHaveURL(/\/admin(\/|$)/);
  });

  test('3.3 Логин админом API (json)', async () => {
    const ctx = await newGuestContext();
    const r = await ctx.post('/api/admin/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(r.ok()).toBeTruthy();
    // cookie установлена — проверим через /api/admin/me
    const me = await ctx.get('/api/admin/me');
    expect(me.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('3.4 Логин админом API (formData)', async () => {
    const ctx = await newGuestContext();
    const r = await ctx.post('/api/admin/auth/login', {
      multipart: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(r.ok()).toBeTruthy();
    await ctx.dispose();
  });

  test('3.5 Неверный пароль → 401', async () => {
    const ctx = await newGuestContext();
    const r = await ctx.post('/api/admin/auth/login', {
      data: { email: ADMIN_EMAIL, password: 'wrong' },
    });
    expect(r.status()).toBe(401);
    await ctx.dispose();
  });

  test('3.6 Несуществующий админ → 401', async () => {
    const ctx = await newGuestContext();
    const r = await ctx.post('/api/admin/auth/login', {
      data: { email: `no-admin-${Date.now()}@x.test`, password: 'whatever' },
    });
    expect(r.status()).toBe(401);
    await ctx.dispose();
  });

  test('3.7 С admin-сессией /admin/login → /admin', async ({ page }) => {
    await adminLoginUI(page);
    await page.goto('/admin/login');
    await expect(page).toHaveURL(/\/admin(\/|$)/);
  });

  test('3.8 GET /api/admin/me', async () => {
    const admin = await newAdminContext();
    const r = await admin.get('/api/admin/me');
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(body.admin.email).toBe(ADMIN_EMAIL);
    expect(['ADMIN', 'TEACHER']).toContain(body.admin.role);
    await admin.dispose();
  });

  test('3.9 Logout админа', async () => {
    const admin = await newAdminContext();
    const out = await admin.post('/api/admin/auth/logout');
    expect(out.ok()).toBeTruthy();
    const me = await admin.get('/api/admin/me');
    expect(me.status()).toBe(401);
    await admin.dispose();
  });

  test('3.10 Смена пароля админа + восстановление', async () => {
    const admin = await newAdminContext();
    const NEW = 'NewAdm123!';
    try {
      const r = await admin.post('/api/admin/auth/change-password', {
        data: { currentPassword: ADMIN_PASSWORD, newPassword: NEW },
      });
      expect(r.ok(), `change-password → ${r.status()}`).toBeTruthy();

      await admin.post('/api/admin/auth/logout');
      await admin.dispose();

      // старый — не работает
      const c2 = await newGuestContext();
      const old = await c2.post('/api/admin/auth/login', {
        data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      });
      expect(old.status()).toBe(401);
      // новый — работает
      const ok = await c2.post('/api/admin/auth/login', {
        data: { email: ADMIN_EMAIL, password: NEW },
      });
      expect(ok.ok()).toBeTruthy();

      // вернуть пароль обратно
      const back = await c2.post('/api/admin/auth/change-password', {
        data: { currentPassword: NEW, newPassword: ADMIN_PASSWORD },
      });
      expect(back.ok()).toBeTruthy();
      await c2.dispose();
    } catch (e) {
      // если что-то упало — попробовать вернуть пароль
      const rec = await newGuestContext();
      await rec.post('/api/admin/auth/login', {
        data: { email: ADMIN_EMAIL, password: NEW },
      });
      await rec.post('/api/admin/auth/change-password', {
        data: { currentPassword: NEW, newPassword: ADMIN_PASSWORD },
      });
      await rec.dispose();
      throw e;
    }
  });

  test('3.11 Смена пароля — кейсы валидации', async () => {
    const admin = await newAdminContext();
    const cases: Array<[any, number]> = [
      [{}, 400],
      [{ currentPassword: 'x' }, 400],
      [{ currentPassword: 'x', newPassword: 'shortx' }, 400], // wrong_password
      [{ currentPassword: ADMIN_PASSWORD, newPassword: ADMIN_PASSWORD }, 400], // same
    ];
    for (const [data, code] of cases) {
      const r = await admin.post('/api/admin/auth/change-password', { data });
      expect(r.status(), `body=${JSON.stringify(data)}`).toBe(code);
    }
    await admin.dispose();
  });
});
