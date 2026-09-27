import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const body = await req.json().catch(() => ({}));
  if (typeof body.handled !== 'boolean') {
    return NextResponse.json({ error: 'handled must be boolean' }, { status: 400 });
  }
  const lead = await prisma.lead
    .update({ where: { id: params.id }, data: { handled: body.handled } })
    .catch(() => null);
  if (!lead) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  await prisma.lead.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
