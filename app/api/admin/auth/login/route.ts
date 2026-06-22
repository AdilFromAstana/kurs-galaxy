import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createAdminSession } from '@/lib/auth/session';
import { rateLimit, rateLimitReset, getClientIp } from '@/lib/rateLimit';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 минут (админ — строжe)

export async function POST(req: Request) {
  const ct = req.headers.get('content-type') ?? '';
  let email = '';
  let password = '';

  if (ct.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    email = String(body.email ?? '');
    password = String(body.password ?? '');
  } else {
    const fd = await req.formData().catch(() => null);
    if (fd) {
      email = String(fd.get('email') ?? '');
      password = String(fd.get('password') ?? '');
    }
  }
  email = email.trim().toLowerCase();

  if (!email || !password) {
    return NextResponse.json({ error: 'Введите email и пароль' }, { status: 400 });
  }

  const ip = getClientIp(req);
  const key = `admin-login:${email}|${ip}`;
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

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }
  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }

  rateLimitReset(key);

  await createAdminSession({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });

  return NextResponse.json({ ok: true });
}
