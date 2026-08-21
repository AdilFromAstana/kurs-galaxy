import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    include: {
      materials: true,
      videos: { orderBy: { order: 'asc' } },
      module: { include: { course: true } },
    },
  });
  if (!lesson) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ lesson });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
  if (typeof body.duration === 'string') data.duration = body.duration;
  if (typeof body.videoUrl === 'string') data.videoUrl = body.videoUrl;
  if (typeof body.content === 'string') data.content = body.content;
  if (typeof body.isFree === 'boolean') data.isFree = body.isFree;
  if (typeof body.order === 'number') data.order = body.order;
  const lesson = await prisma.lesson.update({ where: { id: params.id }, data });
  return NextResponse.json({ lesson });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  await prisma.lesson.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
