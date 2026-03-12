'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Video, FileText, Upload, X, Play, BookOpen, Layers } from 'lucide-react';
import Link from 'next/link';
import { getCourseById } from '@/lib/courseData';

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
  const [isLoading, setIsLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [course, setCourse] = useState(courseId ? getCourseById(courseId) : null);

  useEffect(() => {
    if (courseId) {
      const foundCourse = getCourseById(courseId);
      setCourse(foundCourse);
    }
    if (urlModuleId) {
      setModuleId(urlModuleId);
    }
  }, [courseId, urlModuleId]);
  
  // Обработка загрузки файла
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      setVideoUrl(url);
      
      // Автоматически определить длительность видео
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        const minutes = Math.floor(video.duration / 60);
        const seconds = Math.floor(video.duration % 60);
        setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      };
    }
  };

  // Удаление файла
  const handleRemoveFile = () => {
    setVideoFile(null);
    setVideoPreview('');
    setVideoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!courseId || !course) {
        alert('Ошибка: не указан курс');
        setIsLoading(false);
        return;
      }

      // Создать новый урок
      const newLesson = {
        id: `l${Date.now()}`,
        title,
        duration,
        videoUrl,
        content,
        isFree,
        moduleId,
        materials: [],
        order: 0
      };
      
      // Добавить урок в модуль
      const updatedModules = course.modules.map((module: any) => {
        if (module.id === moduleId) {
          return {
            ...module,
            lessons: [...module.lessons, newLesson]
          };
        }
        return module;
      });
      
      const updatedCourse = {
        ...course,
        modules: updatedModules
      };
      
      // TODO: Обновить в localStorage все курсы
      console.log('Создание урока для курса:', courseId, newLesson);
      
      // Показать уведомление
      alert('✅ Урок успешно создан!');
      
      // Перейти к редактированию урока
      router.push(`/admin/lessons/${newLesson.id}/edit?courseId=${courseId}&moduleId=${moduleId}`);
    } catch (error) {
      alert('Ошибка при создании урока');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Если курс не найден
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

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-24 md:pb-8">
      {/* Header */}
      <div>
        <Link
          href={backLink}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {selectedModule
            ? `Назад к модулю: ${selectedModule.title}`
            : course
            ? `Назад к курсу: ${course.title}`
            : 'Назад к курсам'}
        </Link>
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Создание урока
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          {selectedModule
            ? `Добавить новый урок в модуль "${selectedModule.title}"`
            : 'Добавить новый урок'}
        </p>
      </div>

      {/* Breadcrumbs / Путь */}
      {course && selectedModule && (
        <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
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
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Основная информация */}
        <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Основная информация
          </h2>
          
          {/* Модуль */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Модуль *
            </label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="w-full px-4 py-3 md:py-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Выберите модуль</option>
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
            />
            <p className="text-xs text-gray-500 mt-1">Формат: мм:сс или чч:мм:сс</p>
          </div>
          
          {/* Бесплатный урок */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="w-6 h-6 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
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
        <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Video className="w-5 h-5" />
            Видео урока
          </h2>
          
          {/* Переключатель метода загрузки */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setUploadMethod('url');
                handleRemoveFile();
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                uploadMethod === 'url'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              URL видео
            </button>
            <button
              type="button"
              onClick={() => setUploadMethod('file')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
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
              />
              <p className="text-xs text-gray-500 mt-1">
                Поддерживаются: прямые ссылки, YouTube, Vimeo
              </p>
            </div>
          )}

          {/* Файл метод */}
          {uploadMethod === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Видео файл *
              </label>
              
              {/* Зона загрузки */}
              {!videoFile && !videoPreview && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-700 font-medium mb-1">
                    Нажмите для выбора видео
                  </p>
                  <p className="text-sm text-gray-500">
                    Поддерживаются: MP4, WebM, MOV
                  </p>
                </div>
              )}

              {/* Превью загруженного видео */}
              {(videoFile || videoPreview) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {videoFile?.name || 'Загруженное видео'}
                        </p>
                        {videoFile && (
                          <p className="text-xs text-gray-500">
                            {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                  >
                    Выбрать другой файл
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Предпросмотр видео */}
          {videoPreview && (
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
        <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100">
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
            />
            <p className="text-xs text-gray-500 mt-1">
              Используйте Markdown для форматирования текста
            </p>
          </div>
        </div>
        
        {/* Submit Button - липкая на мобилке */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10 md:static md:border-0 md:p-0">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <Save className="w-5 h-5" />
            {isLoading ? 'Создание...' : 'Создать урок'}
          </button>
        </div>
      </form>
    </div>
  );
}
