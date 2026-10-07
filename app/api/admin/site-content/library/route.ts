import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guard';
import { loadLandingContent } from '@/lib/landingContent';
import { SITE_CONTENT_DIR_PATH, SITE_CONTENT_URL_PREFIX } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

// Все фото, когда-либо загруженные для главной, — новые сверху.
// used=false — файл лежит на сервере, но ни в одном блоке не стоит
// (загрузили и не сохранили, удалили из галереи). Их можно вернуть в пару кликов.
export async function GET() {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const content = await loadLandingContent();
  const used = new Set<string>([
    content.authorPhoto,
    ...content.authorWorks.map((w) => w.src),
    ...content.works.map((w) => w.src),
    ...content.browAuthorWorks.map((w) => w.src),
    ...content.browWorks.map((w) => w.src),
    ...content.results.map((x) => x.photo),
  ]);

  const names = await fs.readdir(SITE_CONTENT_DIR_PATH).catch(() => [] as string[]);
  const files = await Promise.all(
    names
      .filter((n) => /^img-[\w-]+\.(jpe?g|png|webp)$/i.test(n))
      .map(async (n) => {
        const st = await fs.stat(path.join(SITE_CONTENT_DIR_PATH, n)).catch(() => null);
        const src = `${SITE_CONTENT_URL_PREFIX}/${n}`;
        return st ? { src, uploadedAt: st.mtime.toISOString(), used: used.has(src) } : null;
      }),
  );

  const photos = files
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .slice(0, 300);
  return NextResponse.json({ photos });
}
