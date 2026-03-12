'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AdminSession, AdminUser } from '@/types/admin';

const SESSION_COOKIE = 'nail_admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 часа

// Простое хранилище для демо (в продакшене использовать БД)
// В будущем можно заменить на getAdmins() из adminAuth.ts
const getStoredAdmins = (): Map<string, AdminUser> => {
  return new Map([
    ['admin@nailacademy.com', {
      id: '1',
      email: 'admin@nailacademy.com',
      password: btoa('admin123'), // В продакшене bcrypt
      name: 'Главный Администратор',
      role: 'admin',
      createdAt: new Date().toISOString()
    }]
  ]);
};

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  if (!email || !password) {
    // В продакшене можно использовать useFormState для отображения ошибок
    throw new Error('Email и пароль обязательны');
  }
  
  const admins = getStoredAdmins();
  const admin = admins.get(email);
  
  if (!admin || btoa(password) !== admin.password) {
    throw new Error('Неверный email или пароль');
  }
  
  const session: AdminSession = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    expiresAt: Date.now() + COOKIE_MAX_AGE * 1000
  };
  
  // Устанавливаем безопасную cookie
  cookies().set({
    name: SESSION_COOKIE,
    value: JSON.stringify(session),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/'
  });
  
  redirect('/admin');
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE);
  redirect('/admin/login');
}

export async function getSession(): Promise<AdminSession | null> {
  const sessionCookie = cookies().get(SESSION_COOKIE);
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    const session = JSON.parse(sessionCookie.value) as AdminSession;
    
    // Проверка срока действия
    if (session.expiresAt < Date.now()) {
      cookies().delete(SESSION_COOKIE);
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}
