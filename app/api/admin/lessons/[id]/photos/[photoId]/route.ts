import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';
import { deleteLessonPhotoIfLocal } from '@/lib/uploads';

// Обновить подпись под фото (необязательное поле — просто текст или пусто).
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; photoId: string } },
) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const photo = await prisma.lessonPhoto.findFirst({
    where: { id: params.photoId, lessonId: params.id },
  });
  if (!photo) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const caption = String(body.caption ?? '').trim() || null;

  const updated = await prisma.lessonPhoto.update({
    where: { id: photo.id },
    data: { caption },
  });

  return NextResponse.json({ photo: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; photoId: string } },
) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const photo = await prisma.lessonPhoto.findFirst({
    where: { id: params.photoId, lessonId: params.id },
  });
  if (!photo) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  await deleteLessonPhotoIfLocal(photo.url);
  await prisma.lessonPhoto.delete({ where: { id: photo.id } });

  return NextResponse.json({ ok: true });
}
