'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type Photo = { id: string; url: string };

export default function LessonPhotoGrid({ photos }: { photos: Photo[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = () => setOpenIndex(null);
  const prev = () =>
    setOpenIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  const next = () =>
    setOpenIndex((i) => (i === null ? null : (i + 1) % photos.length));

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    // Не даём странице скроллиться под открытым лайтбоксом
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex]);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <img
              src={photo.url}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фото"
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Следующее фото"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <img
            src={photos[openIndex].url}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] rounded-lg object-contain"
          />

          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium">
              {openIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
