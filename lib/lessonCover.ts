import { parseYoutubeId, youtubeThumbnailUrl } from '@/lib/video';

type CoverSource = {
  coverUrl?: string | null;
  videoUrl?: string | null;
  videos?: { url: string; order: number }[];
};

export function youtubeCoverFor(lesson: CoverSource): string | null {
  const ordered = [...(lesson.videos ?? [])].sort((a, b) => a.order - b.order);
  const candidates = [...ordered.map((v) => v.url), lesson.videoUrl ?? ''];

  for (const url of candidates) {
    const id = parseYoutubeId(url);
    if (id) return youtubeThumbnailUrl(id);
  }
  return null;
}

export function resolveLessonCover(lesson: CoverSource): string | null {
  const own = lesson.coverUrl?.trim();
  if (own) return own;
  return youtubeCoverFor(lesson);
}
