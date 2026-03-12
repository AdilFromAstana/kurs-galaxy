'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Layers, FileText, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { getCourseById, coursesData } from '@/lib/courseData';

export default function CreateModulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [course, setCourse] = useState(courseId ? getCourseById(courseId) : null);

  useEffect(() => {
    if (courseId) {
      const foundCourse = getCourseById(courseId);
      setCourse(foundCourse);
    }
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!courseId) {
        alert('Ошибка: не указан ID курса');
        setIsLoading(false);
        return;
      }

      if (!course) {
        alert('Ошибка: курс не найден');
        setIsLoading(false);
        return;
      }

      // Создать новый модуль
      const newModule = {
        id: `m${Date.now()}`,
        title,
        description,
        lessons: [],
        order: course.modules.length
      };

      // Добавить модуль в конкретный курс
      const updatedModules = [...course.modules, newModule];

      const updatedCourse = {
        ...course,
        modules: updatedModules
      };

      // TODO: Обновить в localStorage все курсы
      console.log('Создание модуля для курса:', courseId, newModule);

      // Показать уведомление
      alert('✅ Модуль успешно создан!');

      // Перейти к редактированию модуля
      router.push(`/admin/modules/${newModule.id}/edit?courseId=${courseId}`);
    } catch (error) {
      alert('Ошибка при создании модуля');
      console.error(error);
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

  const backLink = courseId ? `/admin/courses/${courseId}` : '/admin/courses';

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-24 md:pb-8">
      {/* Header */}
      <div>
        <Link
          href={backLink}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {course ? `Назад к курсу: ${course.title}` : 'Назад к курсам'}
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Создание модуля
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          {course ? `Добавить новый модуль в курс "${course.title}"` : 'Добавить новый модуль'}
        </p>
      </div>

      {/* Breadcrumbs / Путь */}
      {course && (
        <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <BookOpen className="w-4 h-4 text-primary-600" />
            <span className="font-semibold text-primary-900">{course.title}</span>
            <span className="text-gray-400">→</span>
            <Layers className="w-4 h-4 text-gray-600" />
            <span>Новый модуль</span>
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

          {/* Название */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название модуля *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 md:py-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Модуль 1: Основы..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Например: "Модуль 1: Основы работы" или "Введение в курс"
            </p>
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание модуля *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-sans resize-none"
              placeholder="Краткое описание модуля..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Краткое описание того, что студенты изучат в этом модуле
            </p>
          </div>
        </div>

        {/* Информация о порядке */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <Layers className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Порядок отображения
              </h3>
              <p className="text-sm text-blue-700">
                {course
                  ? `Новый модуль будет добавлен в конец списка (позиция ${course.modules.length + 1}). Вы сможете изменить порядок на странице редактирования курса.`
                  : 'Новый модуль будет добавлен в конец списка. Вы сможете изменить порядок позже.'}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button - липкая на мобилке */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10 md:static md:border-0 md:p-0">
          <button
            type="submit"
            disabled={isLoading || !courseId}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <Save className="w-5 h-5" />
            {isLoading ? 'Создание...' : 'Создать модуль'}
          </button>
        </div>
      </form>

      {/* Подсказка */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">💡 Что дальше?</h3>
        <p className="text-sm text-gray-600">
          После создания модуля вы сможете добавить в него уроки на странице редактирования модуля.
        </p>
      </div>
    </div>
  );
}
