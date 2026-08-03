'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Video,
  FileText,
  Upload,
  X,
  Play,
  BookOpen,
  Layers,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { uploadLessonVideo } from '@/lib/uploadVideo';

type CourseLite = {
  id: string;
  slug: string;
  title: string;
  modules: Array<{ id: string; title: string }>;
};

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 МБ
const ALLOWED_MIME_PREFIXES = ['video/'];

export default function CreateLessonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const urlModuleId = searchParams.get('moduleId');

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [content, setContent] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [moduleId, setModuleId] = useState(urlModuleId || '');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Чистим blob URL при размонтировании, чтобы не утекала память
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

    if (!ALLOWED_MIME_PREFIXES.some((p) => file.type.startsWith(p))) {
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

    // Авто-определение длительности
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

  const handleRemoveFile = () => {
    revokeBlobIfAny();
    setVideoFile(null);
    setVideoPreview('');
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const switchUploadMethod = (method: 'url' | 'file') => {
    setUploadMethod(method);
    setSubmitError(null);
    if (method === 'url') {
      handleRemoveFile();
    } else {
      setVideoUrl('');
      setVideoPreview('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!moduleId) {
      setSubmitError('Выберите раздел');
      return;
    }

    if (uploadMethod === 'url' && !videoUrl.trim()) {
      setSubmitError('Укажите URL видео');
      return;
    }

    if (uploadMethod === 'file' && !videoFile) {
      setSubmitError('Выберите видео-файл');
      return;
    }

    setSubmitState('creating');

    try {
      // 1. Создаём урок (с пустым videoUrl, если будем загружать файл)
      const initialVideoUrl = uploadMethod === 'url' ? videoUrl.trim() : '';
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

      // 2. Если выбран файл — загружаем
      if (uploadMethod === 'file' && videoFile) {
        setSubmitState('uploading');
        setUploadPercent(0);
        const { promise } = uploadLessonVideo(
          newLessonId,
          videoFile,
          (p) => setUploadPercent(p),
        );
        try {
          await promise;
        } catch (err: any) {
          // Урок уже создан без видео — направим админа в редактирование, чтобы перезалить
          setSubmitError(
            `Урок создан, но видео не загрузилось: ${err.message}. Перезалейте файл из редактирования.`,
          );
          setSubmitState('idle');
          router.push(`/admin/lessons/${newLessonId}/edit?courseId=${targetCourseId}`);
          return;
        }
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
              {videoFile && ' (определяется автоматически после выбора файла)'}
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

        {/* Видео */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Video className="w-5 h-5" />
            Видео урока
          </h2>

          {/* Переключатель метода загрузки */}
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
                required={uploadMethod === 'url'}
                disabled={isBusy}
              />
              <p className="text-xs text-gray-500 mt-1">
                Прямая ссылка на видео-файл (.mp4, .webm). YouTube/Vimeo пока не
                поддерживаются — используйте загрузку файла.
              </p>
            </div>
          )}

          {/* Файл метод */}
          {uploadMethod === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Видео-файл *
              </label>

              {fileError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{fileError}</p>
                </div>
              )}

              {!videoFile ? (
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
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <Video className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {videoFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(videoFile.size / 1024 / 1024).toFixed(2)} МБ
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={isBusy}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      aria-label="Удалить файл"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {!isBusy && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                    >
                      Выбрать другой файл
                    </button>
                  )}
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

          {/* Прогресс-бар загрузки */}
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

          {/* Превью видео */}
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
                  src={videoPreview}
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
