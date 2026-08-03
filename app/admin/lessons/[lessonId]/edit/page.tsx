'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Video,
  FileText,
  Upload,
  X,
  Play,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { confirmToast } from '@/lib/toastConfirm';
import { uploadLessonVideo } from '@/lib/uploadVideo';

type LessonDTO = {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  content: string;
  isFree: boolean;
  moduleId: string;
  module?: { id: string; courseId: string; course?: { id: string; slug: string } };
};

const MAX_FILE_SIZE = 200 * 1024 * 1024;

function isLocalUploadedUrl(url: string | null | undefined): boolean {
  return !!url && url.startsWith('/uploads/lessons/');
}

export default function EditLessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [videoUrl, setVideoUrl] = useState(''); // только для метода URL
  const [content, setContent] = useState('');
  const [isFree, setIsFree] = useState(false);

  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [savedVideoUrl, setSavedVideoUrl] = useState<string>(''); // что уже лежит на сервере

  const [submitState, setSubmitState] = useState<
    'idle' | 'saving' | 'uploading' | 'done'
  >('idle');
  const [uploadPercent, setUploadPercent] = useState(0);
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
          setSavedVideoUrl(l.videoUrl || '');

          if (isLocalUploadedUrl(l.videoUrl)) {
            // Уже есть видео на сервере — показываем как файл
            setUploadMethod('file');
            setVideoPreview(l.videoUrl);
            setVideoUrl('');
          } else {
            setUploadMethod('url');
            setVideoUrl(l.videoUrl || '');
            setVideoPreview(l.videoUrl || '');
          }
        }
        setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [lessonId]);

  useEffect(() => {
    return () => {
      if (videoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  const revokeBlobIfAny = () => {
    if (videoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreview);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    if (!file.type.startsWith('video/')) {
      setFileError('Можно загружать только видео-файлы');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `Файл слишком большой: ${(file.size / 1024 / 1024).toFixed(1)} МБ. Максимум 200 МБ`,
      );
      return;
    }

    revokeBlobIfAny();
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.onloadedmetadata = () => {
      const minutes = Math.floor(video.duration / 60);
      const seconds = Math.floor(video.duration % 60);
      if (Number.isFinite(video.duration)) {
        setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };
  };

  const handleRemoveLocalFileSelection = () => {
    revokeBlobIfAny();
    setVideoFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // если на сервере уже есть видео — вернёмся к его превью
    if (isLocalUploadedUrl(savedVideoUrl)) {
      setVideoPreview(savedVideoUrl);
    } else {
      setVideoPreview('');
    }
  };

  const handleDeleteServerVideo = async () => {
    if (!lesson) return;
    if (!isLocalUploadedUrl(savedVideoUrl)) return;
    const ok = await confirmToast({
      message: 'Удалить загруженное видео с сервера? Урок останется без видео.',
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;

    const res = await fetch(`/api/admin/lessons/${lesson.id}/video`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      revokeBlobIfAny();
      setSavedVideoUrl('');
      setVideoPreview('');
      setVideoFile(null);
      setVideoUrl('');
      toast.success('Видео удалено');
    } else {
      toast.error('Не удалось удалить видео');
    }
  };

  const switchUploadMethod = (method: 'url' | 'file') => {
    setUploadMethod(method);
    setSubmitError(null);
    setFileError(null);
    if (method === 'url') {
      revokeBlobIfAny();
      setVideoFile(null);
      setVideoUrl(isLocalUploadedUrl(savedVideoUrl) ? '' : savedVideoUrl);
      setVideoPreview(isLocalUploadedUrl(savedVideoUrl) ? '' : savedVideoUrl);
    } else {
      setVideoUrl('');
      setVideoPreview(isLocalUploadedUrl(savedVideoUrl) ? savedVideoUrl : '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson) return;
    setSubmitError(null);

    setSubmitState('saving');

    try {
      // 1. Если выбран метод файла и появился новый файл — загружаем
      if (uploadMethod === 'file' && videoFile) {
        setSubmitState('uploading');
        setUploadPercent(0);
        const { promise } = uploadLessonVideo(lesson.id, videoFile, (p) =>
          setUploadPercent(p),
        );
        try {
          const result = await promise;
          setSavedVideoUrl(result.videoUrl);
          revokeBlobIfAny();
          setVideoFile(null);
          setVideoPreview(result.videoUrl);
        } catch (err: any) {
          setSubmitError(`Загрузка не удалась: ${err.message}`);
          setSubmitState('idle');
          return;
        }
      }

      // 2. Сохраняем мета-данные урока (включая видео-URL для метода URL)
      setSubmitState('saving');
      const targetVideoUrl =
        uploadMethod === 'url' ? videoUrl.trim() : undefined; // если метод файла — videoUrl уже обновлён через POST /video

      const patchBody: Record<string, unknown> = {
        title,
        duration,
        content,
        isFree,
      };
      if (typeof targetVideoUrl === 'string') {
        patchBody.videoUrl = targetVideoUrl;
      }

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

  const isBusy = submitState === 'saving' || submitState === 'uploading';
  const hasServerVideo = isLocalUploadedUrl(savedVideoUrl);

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

        {/* Видео */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Video className="w-5 h-5" />
            Видео урока
          </h2>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => switchUploadMethod('url')}
              disabled={isBusy}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                uploadMethod === 'url'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              URL видео
            </button>
            <button
              type="button"
              onClick={() => switchUploadMethod('file')}
              disabled={isBusy}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                uploadMethod === 'file'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Загрузить файл
            </button>
          </div>

          {/* URL метод */}
          {uploadMethod === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL видео *
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  setVideoPreview(e.target.value);
                }}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://..."
                disabled={isBusy}
              />
              <p className="text-xs text-gray-500 mt-1">
                Прямая ссылка на видео-файл. YouTube/Vimeo пока не поддерживаются.
              </p>
            </div>
          )}

          {/* Файл метод */}
          {uploadMethod === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Видео-файл
              </label>

              {fileError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{fileError}</p>
                </div>
              )}

              {/* Уже загруженное на сервер видео */}
              {hasServerVideo && !videoFile && (
                <div className="space-y-3 mb-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <Video className="w-5 h-5 text-green-700 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm">
                          Видео загружено на сервер
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {savedVideoUrl}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteServerVideo}
                      disabled={isBusy}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      aria-label="Удалить видео с сервера"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isBusy}
                    className="w-full px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Заменить новым файлом
                  </button>
                </div>
              )}

              {/* Свежевыбранный файл (ещё не загружен) */}
              {videoFile && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <Upload className="w-5 h-5 text-blue-700 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {videoFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(videoFile.size / 1024 / 1024).toFixed(2)} МБ —
                          загрузится при сохранении
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLocalFileSelection}
                      disabled={isBusy}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      aria-label="Отменить выбор"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Зона выбора файла (если ничего нет) */}
              {!hasServerVideo && !videoFile && (
                <div
                  onClick={() => !isBusy && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isBusy
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-300 cursor-pointer hover:border-primary-500 hover:bg-primary-50'
                  }`}
                >
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-700 font-medium mb-1">
                    Нажмите для выбора видео
                  </p>
                  <p className="text-sm text-gray-500">
                    MP4, WebM, MOV — до 200 МБ
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Прогресс загрузки */}
          {submitState === 'uploading' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="font-medium text-blue-900">
                  Загрузка видео...
                </span>
                <span className="font-semibold text-blue-700">
                  {uploadPercent}%
                </span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-200"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Не закрывайте вкладку до завершения
              </p>
            </div>
          )}

          {/* Превью */}
          {videoPreview && submitState !== 'uploading' && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Предпросмотр
                </label>
                <Play className="w-4 h-4 text-primary-600" />
              </div>
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={
                    isLocalUploadedUrl(videoPreview)
                      ? `/api/lessons/${lesson.id}/video`
                      : videoPreview
                  }
                  controls
                  className="w-full h-full"
                  controlsList="nodownload"
                />
              </div>
            </div>
          )}
        </div>

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
            {submitState === 'saving'
              ? 'Сохранение...'
              : submitState === 'uploading'
                ? `Загрузка ${uploadPercent}%...`
                : 'Сохранить изменения'}
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
