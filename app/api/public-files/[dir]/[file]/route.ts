import path from 'path';
import fs from 'fs/promises';
import {
  CERTIFICATE_DIR_PATH,
  COURSE_THUMBNAIL_DIR_PATH,
  LESSON_COVER_DIR_PATH,
  LESSON_PHOTOS_DIR_PATH,
} from '@/lib/uploads';

export const dynamic = 'force-dynamic';

// Next.js в проде отдаёт из /public только файлы, которые были на диске
// в момент старта сервера. Всё, что админ загрузил позже, давало 404
// до следующего рестарта. next.config.js переписывает такие запросы сюда
// (afterFiles — только если статикой файл не нашёлся), и мы читаем с диска.
const DIRS: Record<string, string> = {
  'lesson-photos': LESSON_PHOTOS_DIR_PATH,
  'course-thumbnails': COURSE_THUMBNAIL_DIR_PATH,
  'lesson-covers': LESSON_COVER_DIR_PATH,
  'certificate-assets': CERTIFICATE_DIR_PATH,
};

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export async function GET(
  _req: Request,
  { params }: { params: { dir: string; file: string } },
) {
  const baseDir = DIRS[params.dir];
  const filename = path.basename(params.file);
  const type = MIME[path.extname(filename).toLowerCase()];
  if (!baseDir || !type || filename !== params.file || filename.startsWith('.')) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const data = await fs.readFile(path.join(baseDir, filename));
    return new Response(data, {
      headers: {
        'Content-Type': type,
        // Имена файлов уникальные (случайный id), содержимое не меняется
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
