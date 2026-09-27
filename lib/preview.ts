'use client';

import { useEffect, useState } from 'react';

// Живой предпросмотр из админки. Админка открывает настоящую страницу сайта
// в iframe с ?preview=1 и передаёт туда несохранённый черновик через
// postMessage (только same-origin). Страница показывает черновик вместо
// данных из API — так админ видит ровно то, что увидит посетитель.

export const PREVIEW_MSG = 'kg-preview';

export type PreviewKind = 'landing' | 'course' | 'lesson';

/** id черновика ещё не созданного курса */
export const PREVIEW_DRAFT_COURSE_ID = 'preview-draft';

export type CoursePreviewDraft = {
  /** null — курс ещё не создан */
  id: string | null;
  title: string;
  description: string;
  thumbnailUrl: string | null;
};

export type LessonPreviewDraft = {
  title: string;
  duration: string;
  content: string;
  coverUrl: string | null;
  videoUrl: string | null;
  videos: { url: string; order: number }[];
  photos: { id: string; url: string; caption?: string | null }[];
};

export function isPreviewFrame(): boolean {
  if (typeof window === 'undefined') return false;
  return window.parent !== window && new URLSearchParams(window.location.search).has('preview');
}

/** Черновик из админки для страницы внутри окна предпросмотра (или null). */
export function usePreviewDraft<T>(kind: PreviewKind): T | null {
  const [draft, setDraft] = useState<T | null>(null);

  useEffect(() => {
    if (!isPreviewFrame()) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data;
      if (d?.type === PREVIEW_MSG && d.kind === kind && 'draft' in d) setDraft(d.draft as T);
    };
    window.addEventListener('message', onMessage);
    // Сообщаем админке, что готовы принять черновик
    window.parent.postMessage({ type: PREVIEW_MSG, ready: kind }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, [kind]);

  return draft;
}
