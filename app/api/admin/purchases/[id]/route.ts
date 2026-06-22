import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

// PATCH — управлять статусом / продлевать срок
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (
    typeof body.status === 'string' &&
    ['ACTIVE', 'EXPIRED', 'CANCELLED'].includes(body.status)
  ) {
    data.status = body.status;
  }

  // Продлить на N дней (от текущей даты или от existing.expiresAt)
  let extendDays: number | null = null;
  if (typeof body.extendDays === 'number' && body.extendDays > 0) {
    extendDays = Math.floor(body.extendDays);
  }

  // Установить безлимитный
  if (body.makeUnlimited === true) {
    data.expiresAt = null;
    data.status = 'ACTIVE';
  }

  const existing = await prisma.purchase.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (extendDays !== null) {
    const base =
      existing.expiresAt && existing.expiresAt.getTime() > Date.now()
        ? existing.expiresAt
        : new Date();
    data.expiresAt = new Date(
      base.getTime() + extendDays * 24 * 60 * 60 * 1000,
    );
    data.status = 'ACTIVE';
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: 'nothing_to_update' },
      { status: 400 },
    );
  }

  const purchase = await prisma.purchase.update({
    where: { id: params.id },
    data,
    include: {
      plan: true,
      course: { select: { id: true, slug: true, title: true } },
    },
  });
  return NextResponse.json({ purchase });
}

// DELETE — отменить (фактически меняем статус, не удаляем для истории)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const existing = await prisma.purchase.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // Переводим в CANCELLED — историю сохраняем для отчётности
  await prisma.purchase.update({
    where: { id: params.id },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json({ ok: true });
}
