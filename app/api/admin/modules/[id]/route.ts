import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const module = await prisma.module.findUnique({
    where: { id: params.id },
    include: { lessons: { orderBy: { order: 'asc' } } },
  });
  if (!module) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ module });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
  if (typeof body.description === 'string') data.description = body.description;
  if (typeof body.order === 'number') data.order = body.order;
  const module = await prisma.module.update({ where: { id: params.id }, data });
  return NextResponse.json({ module });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  await prisma.module.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
