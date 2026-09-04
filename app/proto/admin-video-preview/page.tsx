'use client';

import { useState } from 'react';
import { ExternalLink, Play, Trash2, ChevronUp, ChevronDown, Video } from 'lucide-react';
import { useCourses } from '@/components/providers/CoursesProvider';
import LessonVideoPlaylist from '@/components/lesson/LessonVideoPlaylist';

const DEMO_LESSON_ID = 'cmsx8n1540005ej4vua5qro06';

type Variant = 'inline' | 'button';

export default function AdminVideoPreviewProto() {
  const [variant, setVariant] = useState<Variant>('inline');
  const { getLessonById, isLoading } = useCourses();

  const found = getLessonById(DEMO_LESSON_ID);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!found) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-dark-600 text-center">
          Демо-урок не найден. Песочница рассчитана на мок-режим
          (<code className="text-sm">npm run dev:mock</code>).
        </p>
      </div>
    );
  }

  const { lesson } = found;
  const videos = [...lesson.videos].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-4xl">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 mb-1">
            Песочница
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-dark-900">
            Как админ видит видео урока
          </h1>
          <p className="text-dark-600 mt-2">
            Два варианта одного и того же: чтобы админ видел урок так же, как клиент.
            Переключите и выберите. Это прототип, реальная админка не тронута.
          </p>
        </div>

        <div className="inline-flex p-1 bg-white border border-gray-200 rounded-xl mb-6">
          <button
            onClick={() => setVariant('inline')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              variant === 'inline'
                ? 'bg-primary-600 text-white'
                : 'text-dark-700 hover:bg-gray-50'
            }`}
          >
            Вариант A — блок на странице
          </button>
          <button
            onClick={() => setVariant('button')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              variant === 'button'
                ? 'bg-primary-600 text-white'
                : 'text-dark-700 hover:bg-gray-50'
            }`}
          >
            Вариант B — кнопка в новую вкладку
          </button>
        </div>

        <div className="card mb-6">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-dark-700" />
              <h2 className="text-lg font-bold text-dark-900">Видео урока</h2>
              <span className="text-sm text-dark-500">{videos.length}</span>
            </div>

            {variant === 'button' && (
              <a
                href={`/lesson/${lesson.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Посмотреть как студент
              </a>
            )}
          </div>

          <div className="space-y-3">
            {videos.map((v, i) => (
              <div key={v.id} className="border border-gray-200 rounded-xl p-3 md:p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg bg-white text-dark-900">
                      {v.title || `Видео ${i + 1}`}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-28 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-dark-900">
                        {v.duration || '—'}
                      </div>
                      <p className="text-xs text-gray-500 truncate min-w-0">{v.url}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0 text-gray-300">
                    <ChevronUp className="w-4 h-4" />
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg">
                    <Play className="w-3.5 h-3.5" />
                    Предпросмотр
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                    Удалить
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 py-3 text-center text-sm font-medium text-primary-700 bg-primary-50 rounded-xl">
            + Добавить видео
          </div>
        </div>

        {variant === 'inline' && (
          <div className="card">
            <h2 className="text-lg font-bold text-dark-900 mb-1">
              Так это видит студент
            </h2>
            <p className="text-sm text-dark-500 mb-4">
              Тот же плеер и плейлист, что на странице урока.
            </p>
            <LessonVideoPlaylist
              lessonId={lesson.id}
              videos={videos}
              legacyVideoUrl={lesson.videoUrl}
            />
          </div>
        )}

        {variant === 'button' && (
          <div className="card text-center py-10">
            <ExternalLink className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-dark-600">
              В этом варианте на странице редактирования плеера нет — админ жмёт
              «Посмотреть как студент» и урок открывается в соседней вкладке.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
