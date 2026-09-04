import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';
import {
  ALLOWED_COVER_TYPES,
  MAX_COVER_SIZE,
  deleteLessonCoverIfLocal,
  generateLessonCoverFilename,
  saveLessonCover,
} from '@/lib/uploads';

export const dynamic = 'force-dynamic';

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

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'file_required' }, { status: 400 });
  }
  if (file.size > MAX_COVER_SIZE) {
    return NextResponse.json(
      {
        error: 'file_too_large',
        message: `Максимум ${Math.floor(MAX_COVER_SIZE / 1024 / 1024)} МБ`,
      },
      { status: 400 },
    );
  }
  if (!ALLOWED_COVER_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'bad_type', message: 'Только PNG, JPEG или WebP' },
      { status: 400 },
    );
  }

  const filename = generateLessonCoverFilename(
    params.id,
    file.name,
    file.type,
  );
  const coverUrl = await saveLessonCover(file, filename);

  await deleteLessonCoverIfLocal(lesson.coverUrl);

  const updated = await prisma.lesson.update({
    where: { id: params.id },
    data: { coverUrl },
    select: { id: true, coverUrl: true },
  });

  return NextResponse.json({ lesson: updated }, { status: 201 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const lesson = await prisma.lesson.findUnique({ where: { id: params.id } });
  if (!lesson) {
    return NextResponse.json({ error: 'lesson_not_found' }, { status: 404 });
  }

  await deleteLessonCoverIfLocal(lesson.coverUrl);

  const updated = await prisma.lesson.update({
    where: { id: params.id },
    data: { coverUrl: null },
    select: { id: true, coverUrl: true },
  });

  return NextResponse.json({ lesson: updated });
}
