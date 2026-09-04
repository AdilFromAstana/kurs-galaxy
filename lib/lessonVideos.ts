'use client';

import { uploadLessonVideo } from '@/lib/uploadVideo';

export type LessonVideoDTO = {
  id: string;
  lessonId: string;
  title: string | null;
  url: string;
  duration: string | null;
  order: number;
};

/** Строка списка видео в админке. `id === null` — черновик, ещё не сохранённый в БД. */
export type VideoDraft = {
  key: string;
  id: string | null;
  title: string;
  duration: string;
  url: string;
  file: File | null;
};

export function newDraftKey(): string {
  return `d-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function fromDTO(v: LessonVideoDTO): VideoDraft {
  return {
    key: v.id,
    id: v.id,
    title: v.title ?? '',
    duration: v.duration ?? '',
    url: v.url,
    file: null,
  };
}

export function isLocalUploadedUrl(url: string | null | undefined): boolean {
  return !!url && url.startsWith('/uploads/lessons/');
}

/** Источник для <video src> в админском предпросмотре. */
export function adminPreviewSrc(v: VideoDraft): string {
  if (v.file) return '';
  if (isLocalUploadedUrl(v.url) && v.id) return `/api/lessons/videos/${v.id}`;
  return v.url;
}

/**
 * Досоздаёт черновики видео для уже созданного урока (страница создания урока).
 * Для файлов сначала создаётся строка-заглушка с пустым url, затем заливается файл.
 */
export async function persistVideoDrafts(
  lessonId: string,
  drafts: VideoDraft[],
  onProgress?: (index: number, percent: number) => void,
): Promise<void> {
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    if (d.id) continue;

    const res = await fetch(`/api/admin/lessons/${lessonId}/videos`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: d.title,
        duration: d.duration,
        url: d.file ? '' : d.url,
      }),
    });
    if (!res.ok) {
      throw new Error(`Не удалось создать видео «${d.title || i + 1}»`);
    }
    const { video } = (await res.json()) as { video: LessonVideoDTO };

    if (d.file) {
      const { promise } = uploadLessonVideo(
        lessonId,
        d.file,
        (p) => onProgress?.(i, p),
        video.id,
      );
      await promise;
    }
  }
}
