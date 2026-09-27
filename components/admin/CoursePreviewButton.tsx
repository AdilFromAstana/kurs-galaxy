'use client';

import { useEffect, useMemo, useState } from 'react';
import { DevicePreviewModal, PreviewButton } from '@/components/admin/DevicePreviewModal';
import { PREVIEW_DRAFT_COURSE_ID, type CoursePreviewDraft } from '@/lib/preview';

/**
 * «Предпросмотр» курса: карточка на главной, страница курса и каталог —
 * с несохранённым названием, описанием и ещё не загруженным логотипом.
 */
export function CoursePreviewButton({
  courseId,
  title,
  description,
  savedUrl,
  file,
}: {
  /** null — курс ещё создаётся */
  courseId: string | null;
  title: string;
  description: string;
  savedUrl: string | null;
  file: File | null;
}) {
  const [open, setOpen] = useState(false);

  // Локальный файл логотипа показываем по blob-ссылке (iframe того же origin её видит)
  const fileUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
  }, [fileUrl]);

  const draft = useMemo<CoursePreviewDraft>(
    () => ({
      id: courseId,
      title: title.trim() || 'Название курса',
      description: description.trim(),
      thumbnailUrl: fileUrl ?? savedUrl,
    }),
    [courseId, title, description, fileUrl, savedUrl],
  );

  const id = courseId ?? PREVIEW_DRAFT_COURSE_ID;

  return (
    <>
      <PreviewButton onClick={() => setOpen(true)} />
      <DevicePreviewModal
        open={open}
        onClose={() => setOpen(false)}
        kind="course"
        draft={draft}
        views={[
          { label: 'Карточка на главной', url: '/?preview=1#courses' },
          { label: 'Страница курса', url: `/course/${id}?preview=1` },
          { label: 'Каталог', url: '/courses?preview=1' },
        ]}
        note={
          courseId
            ? undefined
            : 'Курс ещё не создан: программа и цены появятся после добавления разделов и тарифов.'
        }
      />
    </>
  );
}
