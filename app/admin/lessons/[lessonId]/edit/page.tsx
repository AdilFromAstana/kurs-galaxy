'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  FileText,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { confirmToast } from '@/lib/toastConfirm';
import LessonVideosManager from '@/components/admin/LessonVideosManager';
import {
  fromDTO,
  type LessonVideoDTO,
  type VideoDraft,
} from '@/lib/lessonVideos';

type LessonDTO = {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  content: string;
  isFree: boolean;
  moduleId: string;
  videos?: LessonVideoDTO[];
  module?: { id: string; courseId: string; course?: { id: string; slug: string } };
};

export default function EditLessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [content, setContent] = useState('');
  const [isFree, setIsFree] = useState(false);

  const [videos, setVideos] = useState<VideoDraft[]>([]);

  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'done'>(
    'idle',
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        credentials: 'include',
      });
      if (!cancel) {
        if (res.ok) {
          const data = await res.json();
          const l = data.lesson as LessonDTO;
          setLesson(l);
          setTitle(l.title);
          setDuration(l.duration);
          setContent(l.content);
          setIsFree(l.isFree);
          setVideos((l.videos ?? []).map(fromDTO));
        }
        setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson) return;
    setSubmitError(null);

    setSubmitState('saving');

    try {
      // Видео уже сохранены сразу при добавлении — здесь только мета урока.
      // legacy-поле videoUrl держим в синхроне с первым видео списка.
      const patchBody: Record<string, unknown> = {
        title,
        duration,
        content,
        isFree,
        videoUrl: videos[0]?.url ?? '',
      };

      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error ?? 'Не удалось сохранить урок');
        setSubmitState('idle');
        return;
      }

      setSubmitState('done');
      router.push(`/admin/modules/${lesson.moduleId}/edit`);
    } catch (error) {
      console.error(error);
      setSubmitError('Ошибка при сохранении');
      setSubmitState('idle');
    }
  };

  const handleDelete = async () => {
    if (!lesson) return;
    const ok = await confirmToast({
      message: `Удалить урок «${lesson.title}»?`,
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      toast.success('Урок удалён');
      router.push(`/admin/modules/${lesson.moduleId}/edit`);
    } else {
      toast.error('Не удалось удалить урок');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Урок не найден</p>
        <Link href="/admin/courses" className="btn btn-primary mt-4 inline-flex">
          Назад к курсам
        </Link>
      </div>
    );
  }

  const isBusy = submitState === 'saving';

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-24 md:pb-8 max-w-6xl">
      {/* Header */}
      <div>
        <Link
          href={
            lesson.moduleId
              ? `/admin/modules/${lesson.moduleId}/edit`
              : '/admin/courses'
          }
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к разделу
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Редактирование урока
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">ID: {lesson.id}</p>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Основная информация */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Основная информация
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название урока *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 md:py-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Урок 1: Введение..."
              required
              disabled={isBusy}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Длительность *
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="12:30"
              required
              disabled={isBusy}
            />
            <p className="text-xs text-gray-500 mt-1">
              Формат: мм:сс или чч:мм:сс
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="w-6 h-6 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                disabled={isBusy}
              />
              <div>
                <span className="block font-medium text-gray-900">
                  Бесплатный урок
                </span>
                <span className="block text-sm text-gray-600">
                  Урок будет доступен всем пользователям без покупки
                </span>
              </div>
            </label>
          </div>
        </div>

        <LessonVideosManager
          lessonId={lesson.id}
          videos={videos}
          onChange={setVideos}
          disabled={isBusy}
        />

        {/* Контент урока */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Контент урока (Markdown)
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Контент *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              placeholder="# Заголовок&#10;&#10;Текст урока..."
              required
              disabled={isBusy}
            />
            <p className="text-xs text-gray-500 mt-1">
              Используйте Markdown для форматирования текста
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4 z-[60] md:static md:border-0 md:p-0 md:bottom-auto">
          <button
            type="submit"
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation shadow-lg"
          >
            <Save className="w-5 h-5" />
            {submitState === 'saving' ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isBusy}
            className="mt-2 w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Удалить урок
          </button>
        </div>
      </form>
    </div>
  );
}
