import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';
import { isLocalLessonPhoto } from '@/lib/uploads';

// Прикрепить уже загруженное фото (см. POST /api/admin/lesson-photos) к уроку.
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
  if (!url || !isLocalLessonPhoto(url)) {
    return NextResponse.json({ error: 'bad_url' }, { status: 400 });
  }

  const count = await prisma.lessonPhoto.count({ where: { lessonId: lesson.id } });
  const photo = await prisma.lessonPhoto.create({
    data: { lessonId: lesson.id, url, order: count },
  });

  return NextResponse.json({ photo }, { status: 201 });
}
