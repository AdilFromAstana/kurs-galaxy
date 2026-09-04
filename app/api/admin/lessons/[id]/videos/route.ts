import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const lesson = await prisma.lesson.findUnique({ where: { id: params.id } });
  if (!lesson) {
    return NextResponse.json({ error: 'lesson_not_found' }, { status: 404 });
  }

  const videos = await prisma.lessonVideo.findMany({
    where: { lessonId: params.id },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json({ videos });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const lesson = await prisma.lesson.findUnique({ where: { id: params.id } });
  if (!lesson) {
    return NextResponse.json({ error: 'lesson_not_found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const url = String(body.url ?? '').trim();
  const title = String(body.title ?? '').trim();
  const duration = String(body.duration ?? '').trim();

  const last = await prisma.lessonVideo.findFirst({
    where: { lessonId: params.id },
    orderBy: { order: 'desc' },
  });
  const order = (last?.order ?? -1) + 1;

  const video = await prisma.lessonVideo.create({
    data: {
      lessonId: params.id,
      title: title || null,
      url,
      duration: duration || null,
      order,
    },
  });

  return NextResponse.json({ video }, { status: 201 });
}
