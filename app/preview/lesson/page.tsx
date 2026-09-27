'use client';

import { ArrowLeft, Eye, Play } from 'lucide-react';
import Header from '@/components/layout/Header';
import { LessonContentCard, LessonPhotosCard, LessonTitle } from '@/components/lesson/LessonParts';
import { resolveLessonCover } from '@/lib/lessonCover';
import { usePreviewDraft, type LessonPreviewDraft } from '@/lib/preview';

// Страница урока глазами ученицы — открывается только внутри окна
// предпросмотра админки, данные приходят черновиком из формы урока.
export default function LessonPreviewPage() {
  const lesson = usePreviewDraft<LessonPreviewDraft>('lesson');

  if (!lesson) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center text-dark-600">
        <Eye className="h-10 w-10 text-primary-500" />
        <p>Предпросмотр урока открывается из админки — кнопкой «Предпросмотр» на странице урока.</p>
      </div>
    );
  }

  const cover = resolveLessonCover(lesson);
  const hasVideo = lesson.videos.length > 0 || !!lesson.videoUrl;

  return (
    <>
      <Header />
      <main className="min-h-screen page-wrapper pb-24 md:pb-8">
        <div className="container-custom max-w-7xl">
          <span className="inline-flex items-center gap-2 text-dark-600 mb-4 md:mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к курсу</span>
          </span>

          <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] lg:gap-8 gap-6">
            <div className="space-y-6 md:space-y-8 min-w-0">
              <LessonTitle
                title={lesson.title.trim() || 'Название урока'}
                duration={lesson.duration || '—'}
                cover={cover}
              />

              {/* Видео — схематично: в превью не проигрывается */}
              {hasVideo && (
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-gray-900 shadow-soft">
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary-600 shadow-lg">
                      <Play className="h-7 w-7 translate-x-0.5" fill="currentColor" />
                    </span>
                    <span className="rounded-full bg-black/50 px-3 py-1 text-xs">
                      Видео урока · {lesson.videos.length || 1} шт.
                    </span>
                  </div>
                </div>
              )}

              <LessonContentCard content={lesson.content} />
              <LessonPhotosCard photos={lesson.photos} />
            </div>

            {/* Место под список уроков курса, как на настоящей странице */}
            <aside className="hidden lg:block">
              <div className="card space-y-3">
                <p className="font-bold text-dark-900">Уроки курса</p>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-11 rounded-lg bg-gray-100" />
                ))}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
