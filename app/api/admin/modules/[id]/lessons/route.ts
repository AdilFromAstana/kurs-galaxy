import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const module = await prisma.module.findUnique({ where: { id: params.id } });
  if (!module) return NextResponse.json({ error: 'module_not_found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? '').trim();
  const duration = String(body.duration ?? '').trim() || '00:00';
  const videoUrl = String(body.videoUrl ?? '').trim();
  const content = String(body.content ?? '');
  const isFree = Boolean(body.isFree);

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const last = await prisma.lesson.findFirst({
    where: { moduleId: module.id },
    orderBy: { order: 'desc' },
  });
  const order = typeof body.order === 'number' ? body.order : (last?.order ?? -1) + 1;

  const lesson = await prisma.lesson.create({
    data: { moduleId: module.id, title, duration, videoUrl, content, isFree, order },
  });
  return NextResponse.json({ lesson }, { status: 201 });
}
