import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth/session';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

export const dynamic = 'force-dynamic';

const MIN_PASSWORD = 6;

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const currentPassword = String(body.currentPassword ?? '');
  const newPassword = String(body.newPassword ?? '');

  if (!currentPassword) {
    return NextResponse.json(
      { error: 'current_required', message: 'Введите текущий пароль' },
      { status: 400 },
    );
  }
  if (newPassword.length < MIN_PASSWORD) {
    return NextResponse.json(
      {
        error: 'weak_password',
        message: `Новый пароль должен быть не короче ${MIN_PASSWORD} символов`,
      },
      { status: 400 },
    );
  }
  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: 'same_password', message: 'Новый пароль совпадает с текущим' },
      { status: 400 },
    );
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.id },
  });
  if (!admin) {
    return NextResponse.json({ error: 'admin_not_found' }, { status: 404 });
  }

  const ok = await verifyPassword(currentPassword, admin.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: 'wrong_password', message: 'Текущий пароль неверный' },
      { status: 400 },
    );
  }

  const newHash = await hashPassword(newPassword);
  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ ok: true });
}
