import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createAdminSession, createUserSession } from '@/lib/auth/session';
import { rateLimit, rateLimitReset, getClientIp } from '@/lib/rateLimit';

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 минут

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (!email || !password) {
    return NextResponse.json({ error: 'Введите email и пароль' }, { status: 400 });
  }

  const ip = getClientIp(req);
  const key = `user-login:${email}|${ip}`;
  const rl = rateLimit(key, MAX_ATTEMPTS, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: 'rate_limited',
        message: `Слишком много попыток. Попробуйте через ${Math.ceil(rl.retryAfterSec / 60)} мин`,
      },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
    // Единая форма входа: данные администратора тоже подходят —
    // тогда открываем админскую сессию и отправляем в админку
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin && (await verifyPassword(password, admin.passwordHash))) {
      rateLimitReset(key);
      await createAdminSession({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      });
      return NextResponse.json({ admin: true, redirect: '/admin' });
    }
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }

  // Успех — сбрасываем счётчик, чтобы юзер мог логиниться сколько хочет
  rateLimitReset(key);

  await createUserSession({ userId: user.id, email: user.email, name: user.name });

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
}
