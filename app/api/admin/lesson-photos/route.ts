import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guard';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  generateLessonPhotoFilename,
  saveLessonPhoto,
} from '@/lib/uploads';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Загрузка одного фото в галерею урока. Не привязана к lessonId —
// на экране создания урок ещё не существует, поэтому файл сохраняется
// сразу, а его URL прикрепляется к уроку отдельным вызовом
// POST /api/admin/lessons/[id]/photos (после того как урок создан).
export async function POST(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form_data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'empty_file' }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      {
        error: 'file_too_large',
        message: `Максимум ${Math.floor(MAX_IMAGE_SIZE / 1024 / 1024)} МБ`,
      },
      { status: 413 },
    );
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        error: 'unsupported_type',
        message: 'Поддерживаются только PNG и JPG',
      },
      { status: 415 },
    );
  }

  const filename = generateLessonPhotoFilename(file.name, file.type);
  const url = await saveLessonPhoto(file, filename);

  return NextResponse.json({ url });
}
