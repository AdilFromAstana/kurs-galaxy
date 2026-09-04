import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';
import {
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEO_SIZE,
  deleteLessonVideoIfLocal,
  generateVideoFilename,
  saveLessonVideo,
} from '@/lib/uploads';

// Легаси: одиночное видео урока (Lesson.videoUrl). Для новых уроков админка
// использует /api/admin/lessons/[id]/videos/*. Оставлен для старых данных.
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Apple/iPhone иногда отдают без MIME — fallback по расширению
const FALLBACK_EXT_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
};

function detectMime(file: File): string {
  if (file.type && ALLOWED_VIDEO_TYPES.includes(file.type)) return file.type;
  const lowered = file.name.toLowerCase();
  for (const [ext, mime] of Object.entries(FALLBACK_EXT_TYPES)) {
    if (lowered.endsWith(ext)) return mime;
  }
  return file.type || 'application/octet-stream';
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

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'invalid_form_data' },
      { status: 400 },
    );
  }

  const file = formData.get('video');
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'no_file', message: 'Файл не передан' },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { error: 'empty_file', message: 'Файл пустой' },
      { status: 400 },
    );
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return NextResponse.json(
      {
        error: 'file_too_large',
        message: `Файл слишком большой. Максимум ${Math.floor(MAX_VIDEO_SIZE / 1024 / 1024)} МБ`,
      },
      { status: 413 },
    );
  }

  const mime = detectMime(file);
  if (!ALLOWED_VIDEO_TYPES.includes(mime)) {
    return NextResponse.json(
      {
        error: 'unsupported_type',
        message: 'Поддерживаются только: MP4, WebM, MOV',
      },
      { status: 415 },
    );
  }

  // Удалить предыдущее видео, если оно было загружено локально
  await deleteLessonVideoIfLocal(lesson.videoUrl);

  const filename = generateVideoFilename(file.name, mime);
  let publicUrl: string;
  try {
    publicUrl = await saveLessonVideo(file, filename);
  } catch (err: any) {
    console.error('saveLessonVideo failed:', err);
    return NextResponse.json(
      { error: 'save_failed', message: 'Не удалось сохранить файл' },
      { status: 500 },
    );
  }

  await prisma.lesson.update({
    where: { id: params.id },
    data: { videoUrl: publicUrl },
  });

  return NextResponse.json({
    videoUrl: publicUrl,
    size: file.size,
    type: mime,
  });
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

  await deleteLessonVideoIfLocal(lesson.videoUrl);

  await prisma.lesson.update({
    where: { id: params.id },
    data: { videoUrl: '' },
  });

  return NextResponse.json({ ok: true });
}
