'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import {
  createUserSession,
  createAdminSession,
  clearUserSession,
  clearAdminSession,
  getUserSession,
  getAdminSession,
} from '@/lib/auth/session';

// ===== Студенты =====

export async function registerUserAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const name = String(formData.get('name') ?? '').trim();

  if (!email || !password || !name) {
    throw new Error('Все поля обязательны');
  }
  if (password.length < 6) {
    throw new Error('Пароль должен быть не короче 6 символов');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Пользователь с таким email уже существует');
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  await createUserSession({ userId: user.id, email: user.email, name: user.name });
  redirect('/dashboard');
}

export async function loginUserAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) throw new Error('Введите email и пароль');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Неверный email или пароль');

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error('Неверный email или пароль');

  await createUserSession({ userId: user.id, email: user.email, name: user.name });
  redirect('/dashboard');
}

export async function logoutUserAction() {
  await clearUserSession();
  redirect('/');
}

export async function meAction() {
  return getUserSession();
}

// ===== Админы =====

export async function loginAdminAction(formData: FormData) {
  try {
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');

    if (!email || !password) throw new Error('Введите email и пароль');

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) throw new Error('Неверный email или пароль');

    const ok = await verifyPassword(password, admin.passwordHash);
    if (!ok) throw new Error('Неверный email или пароль');

    await createAdminSession({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
  } catch (e: any) {
    if (e?.digest?.startsWith?.('NEXT_REDIRECT')) throw e;
    console.error('[loginAdminAction] error:', e?.message ?? e);
    throw e;
  }
  redirect('/admin');
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect('/admin/login');
}

export async function getAdminSessionAction() {
  return getAdminSession();
}

// ===== Совместимость со старой Server Action из app/admin/login/page.tsx =====
export const loginAction = loginAdminAction;
export const logoutAction = logoutAdminAction;
export const getSession = getAdminSession;
