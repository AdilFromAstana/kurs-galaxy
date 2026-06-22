import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createUserSession } from '@/lib/auth/session';
import { sendEmail, welcomeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

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

async function sendWelcomeEmailFireAndForget(req: Request, user: {
  email: string;
  name: string;
}) {
  try {
    const baseUrl = getBaseUrl(req);
    const settings = await prisma.certificateSettings.findUnique({
      where: { id: 'default' },
    });
    const brandName = settings?.brandName ?? 'KursGalaxy.kz';
    const message = welcomeEmail({
      recipientName: user.name,
      catalogUrl: `${baseUrl}/courses`,
      brandName,
    });
    message.to = user.email;
    await sendEmail(message);
  } catch (err) {
    console.error('[register] welcome email failed:', err);
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const name = String(body.name ?? '').trim();

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Пароль должен быть не короче 6 символов' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, name, passwordHash } });

  await createUserSession({ userId: user.id, email: user.email, name: user.name });

  // Welcome email — не блокируем регистрацию ошибкой почты.
  // Запускаем без await чтобы быстрее ответить юзеру.
  void sendWelcomeEmailFireAndForget(req, user);

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
}
