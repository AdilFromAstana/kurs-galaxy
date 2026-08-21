'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Video,
  FileText,
  BookOpen,
  Layers,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import LessonVideosManager from '@/components/admin/LessonVideosManager';
import { persistVideoDrafts, type VideoDraft } from '@/lib/lessonVideos';

type CourseLite = {
  id: string;
  slug: string;
  title: string;
  modules: Array<{ id: string; title: string }>;
};

export default function CreateLessonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const urlModuleId = searchParams.get('moduleId');

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [content, setContent] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [moduleId, setModuleId] = useState(urlModuleId || '');

  const [videos, setVideos] = useState<VideoDraft[]>([]);

  const [submitState, setSubmitState] = useState<
    'idle' | 'creating' | 'uploading' | 'done'
  >('idle');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [course, setCourse] = useState<CourseLite | null>(null);

  useEffect(() => {
    if (!courseId) return;
    let cancel = false;
    (async () => {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        credentials: 'include',
      });
      if (!cancel && res.ok) {
        const data = await res.json();
        setCourse(data.course);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (urlModuleId) setModuleId(urlModuleId);
  }, [urlModuleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!moduleId) {
      setSubmitError('Выберите раздел');
      return;
    }

    if (videos.length === 0) {
      setSubmitError('Добавьте хотя бы одно видео');
      return;
    }

    setSubmitState('creating');

    try {
      // 1. Создаём урок; legacy-поле videoUrl заполняем первым видео по URL
      const initialVideoUrl = videos[0].file ? '' : videos[0].url;
      const createRes = await fetch(
        `/api/admin/modules/${moduleId}/lessons`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            duration,
            videoUrl: initialVideoUrl,
            content,
            isFree,
          }),
        },
      );
      const createData = await createRes.json().catch(() => ({}));

      if (!createRes.ok) {
        setSubmitError(createData.error ?? 'Не удалось создать урок');
        setSubmitState('idle');
        return;
      }

      const newLessonId = createData.lesson.id as string;
      const targetCourseId =
        courseId ?? createData.lesson.module?.courseId ?? '';

      // 2. Создаём строки видео и заливаем выбранные файлы
      setSubmitState('uploading');
      setUploadPercent(0);
      try {
        await persistVideoDrafts(newLessonId, videos, (_i, p) =>
          setUploadPercent(p),
        );
      } catch (err: any) {
        // Урок уже создан — направим админа в редактирование, чтобы дозалить видео
        setSubmitError(
          `Урок создан, но видео загрузились не полностью: ${err.message}. Продолжите в редактировании.`,
        );
        setSubmitState('idle');
        router.push(`/admin/lessons/${newLessonId}/edit?courseId=${targetCourseId}`);
        return;
      }

      setSubmitState('done');
      router.push(`/admin/courses/${targetCourseId}`);
    } catch (error) {
      console.error(error);
      setSubmitError('Ошибка при создании урока');
      setSubmitState('idle');
    }
  };

  if (courseId && !course) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Курс не найден</h2>
        <p className="text-gray-600 mb-6">Курс с ID "{courseId}" не существует</p>
        <Link
          href="/admin/courses"
          className="px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium"
        >
          К списку курсов
        </Link>
      </div>
    );
  }

  const backLink = moduleId
    ? `/admin/modules/${moduleId}/edit?courseId=${courseId}`
    : courseId
      ? `/admin/courses/${courseId}`
      : '/admin/courses';

  const selectedModule = course?.modules.find((m: any) => m.id === moduleId);

  const isBusy = submitState === 'creating' || submitState === 'uploading';

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-24 md:pb-8 max-w-6xl">
      {/* Header */}
      <div>
        <Link
          href={backLink}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {selectedModule
            ? `Назад к разделу: ${selectedModule.title}`
            : course
              ? `Назад к курсу: ${course.title}`
              : 'Назад к курсам'}
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Создание урока
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          {selectedModule
            ? `Добавить новый урок в раздел "${selectedModule.title}"`
            : 'Добавить новый урок'}
        </p>
      </div>

      {/* Breadcrumbs */}
      {course && selectedModule && (
        <div className="bg-primary-50 rounded-2xl p-4 border border-primary-100">
          <div className="flex items-center gap-2 text-sm text-gray-700 flex-wrap">
            <BookOpen className="w-4 h-4 text-primary-600" />
            <span className="font-semibold text-primary-900">{course.title}</span>
            <span className="text-gray-400">→</span>
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">{selectedModule.title}</span>
            <span className="text-gray-400">→</span>
            <Video className="w-4 h-4 text-gray-600" />
            <span>Новый урок</span>
          </div>
        </div>
      )}

      {/* Submit error */}
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

          {/* Раздел */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Раздел *
            </label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="w-full px-4 py-3 md:py-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              disabled={isBusy}
            >
              <option value="">Выберите раздел</option>
              {course?.modules.map((module: any) => (
                <option key={module.id} value={module.id}>
                  {module.title}
                </option>
              ))}
            </select>
          </div>

          {/* Название */}
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

          {/* Длительность */}
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

          {/* Бесплатный урок */}
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
          lessonId={null}
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
        <div className="pt-2">
          <button
            type="submit"
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <Save className="w-5 h-5" />
            {submitState === 'creating'
              ? 'Создание урока...'
              : submitState === 'uploading'
                ? `Загрузка видео ${uploadPercent}%...`
                : 'Создать урок'}
          </button>
        </div>
      </form>
    </div>
  );
}
