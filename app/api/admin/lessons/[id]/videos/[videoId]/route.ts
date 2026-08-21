import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';
import { deleteLessonVideoIfLocal } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; videoId: string } },
) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const existing = await prisma.lessonVideo.findUnique({
    where: { id: params.videoId },
  });
  if (!existing || existing.lessonId !== params.id) {
    return NextResponse.json({ error: 'video_not_found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.title === 'string') data.title = body.title.trim() || null;
  if (typeof body.duration === 'string') {
    data.duration = body.duration.trim() || null;
  }
  if (typeof body.order === 'number') data.order = body.order;
  if (typeof body.url === 'string') {
    const nextUrl = body.url.trim();
    // Смена URL на внешний осиротит ранее загруженный локальный файл — удаляем его
    if (nextUrl !== existing.url) {
      await deleteLessonVideoIfLocal(existing.url);
    }
    data.url = nextUrl;
  }

  const video = await prisma.lessonVideo.update({
    where: { id: params.videoId },
    data,
  });
  return NextResponse.json({ video });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; videoId: string } },
) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const existing = await prisma.lessonVideo.findUnique({
    where: { id: params.videoId },
  });
  if (!existing || existing.lessonId !== params.id) {
    return NextResponse.json({ error: 'video_not_found' }, { status: 404 });
  }

  await deleteLessonVideoIfLocal(existing.url);
  await prisma.lessonVideo.delete({ where: { id: params.videoId } });

  // Уплотняем order, чтобы не оставалось дыр в нумерации
  const rest = await prisma.lessonVideo.findMany({
    where: { lessonId: params.id },
    orderBy: { order: 'asc' },
  });
  await prisma.$transaction(
    rest.map((v, i) =>
      prisma.lessonVideo.update({ where: { id: v.id }, data: { order: i } }),
    ),
  );

  return NextResponse.json({ ok: true });
}
