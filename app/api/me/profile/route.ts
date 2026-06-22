import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth/guard';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createUserSession } from '@/lib/auth/session';

// PATCH { name?: string }
export async function PATCH(req: Request) {
  const r = await requireUser();
  if ('response' in r) return r.response;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: r.session.userId },
    data,
    select: { id: true, email: true, name: true },
  });

  await createUserSession({ userId: user.id, email: user.email, name: user.name });
  return NextResponse.json({ user });
}

// POST { currentPassword, newPassword } — смена пароля
export async function POST(req: Request) {
  const r = await requireUser();
  if ('response' in r) return r.response;
  const body = await req.json().catch(() => ({}));
  const currentPassword = String(body.currentPassword ?? '');
  const newPassword = String(body.newPassword ?? '');

  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Пароль должен быть не короче 6 символов' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: r.session.userId } });
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Текущий пароль неверный' }, { status: 401 });

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
