'use client';

import { useMemo, useState } from 'react';
import { DevicePreviewModal, PreviewButton } from '@/components/admin/DevicePreviewModal';
import type { LessonPreviewDraft } from '@/lib/preview';

/** «Предпросмотр» урока: страница урока глазами ученицы с текущими правками. */
export function LessonPreviewButton({
  title,
  duration,
  content,
  coverUrl,
  videoUrl,
  videos,
  photos,
  label,
  className,
}: {
  title: string;
  duration: string;
  content: string;
  coverUrl: string | null;
  videoUrl?: string | null;
  videos: { url: string; file?: File | null }[];
  photos: { key: string; url: string; caption?: string }[];
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const draft = useMemo<LessonPreviewDraft>(
    () => ({
      title,
      duration,
      content,
      coverUrl,
      videoUrl: videoUrl ?? null,
      // Незагруженный файл видео считаем видео (url ещё пустой)
      videos: videos
        .filter((v) => v.url || v.file)
        .map((v, i) => ({ url: v.url, order: i })),
      photos: photos.map((p) => ({ id: p.key, url: p.url, caption: p.caption ?? null })),
    }),
    [title, duration, content, coverUrl, videoUrl, videos, photos],
  );

  return (
    <>
      <PreviewButton onClick={() => setOpen(true)} label={label} className={className} />
      <DevicePreviewModal
        open={open}
        onClose={() => setOpen(false)}
        kind="lesson"
        draft={draft}
        views={[{ label: 'Страница урока', url: '/preview/lesson?preview=1' }]}
        note="Так урок увидит ученица. Видео показано схематично — в предпросмотре оно не проигрывается."
      />
    </>
  );
}
