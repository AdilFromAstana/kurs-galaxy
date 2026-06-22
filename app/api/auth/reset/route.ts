import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';

// POST { token, newPassword }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? '');
  const newPassword = String(body.newPassword ?? '');

  if (!token || newPassword.length < 6) {
    return NextResponse.json({ error: 'Невалидные данные' }, { status: 400 });
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Ссылка недействительна или истекла' }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
