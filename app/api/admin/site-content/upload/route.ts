import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guard';
import {
  ALLOWED_SITE_CONTENT_TYPES,
  MAX_SITE_CONTENT_SIZE,
  saveSiteContentImage,
} from '@/lib/uploads';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Загрузка фото для главной (автор, работы учениц). Возвращает URL,
// который редактор подставляет в контент и сохраняет вместе с ним.
export async function POST(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'no_file', message: 'Файл не выбран' }, { status: 400 });
  }
  if (file.size > MAX_SITE_CONTENT_SIZE) {
    return NextResponse.json(
      { error: 'file_too_large', message: `Максимум ${MAX_SITE_CONTENT_SIZE / 1024 / 1024} МБ` },
      { status: 413 },
    );
  }
  if (!ALLOWED_SITE_CONTENT_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'unsupported_type', message: 'Поддерживаются JPG, PNG и WEBP' },
      { status: 415 },
    );
  }

  const url = await saveSiteContentImage(file);
  return NextResponse.json({ url });
}
