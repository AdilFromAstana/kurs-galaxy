import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { passwordResetEmail, sendEmail } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const MAX_REQUESTS = 3;
const WINDOW_MS = 10 * 60 * 1000; // 10 минут

function getBaseUrl(req: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  }
  const origin = req.headers.get('origin');
  if (origin) return origin;
  const host = req.headers.get('host');
  if (host) {
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    return `${proto}://${host}`;
  }
  return 'http://localhost:39010';
}

// POST { email } — генерируем токен, шлём письмо со ссылкой.
// Никогда не палим существование email и никогда не возвращаем токен в ответе.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  // Rate-limit: чтобы не заспамить почту юзеру и не забить БД токенами.
  const ip = getClientIp(req);
  const rl = rateLimit(`reset:${email}|${ip}`, MAX_REQUESTS, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Всегда отвечаем 200, чтобы по разнице ответов нельзя было понять,
  // зарегистрирован ли email в системе.
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = randomBytes(24).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const baseUrl = getBaseUrl(req);
  const resetUrl = `${baseUrl}/auth/reset?token=${token}`;

  const message = passwordResetEmail({
    recipientName: user.name,
    resetUrl,
    expiresInHours: 1,
  });
  message.to = email;

  const result = await sendEmail(message);
  if (!result.ok) {
    // Логируем reset-ссылку только в dev. На проде это утечка bearer-токена
    // в логи (Datadog/CloudWatch) — лучше отдельный канал ошибок без URL.
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[password-reset] для ${email} → ${resetUrl}`);
    } else {
      console.error('[password-reset] sendEmail failed', { email });
    }
  }

  return NextResponse.json({ ok: true });
}
