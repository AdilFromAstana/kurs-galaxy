import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';
import { deleteLessonPhotoIfLocal } from '@/lib/uploads';

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
