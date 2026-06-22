import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

// body: { items: [{ id, order }] }
export async function POST(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const body = await req.json().catch(() => ({}));
  const items: Array<{ id: string; order: number }> = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return NextResponse.json({ error: 'items required' }, { status: 400 });

  await prisma.$transaction(
    items.map((it) => prisma.module.update({ where: { id: it.id }, data: { order: it.order } }))
  );
  return NextResponse.json({ ok: true });
}
