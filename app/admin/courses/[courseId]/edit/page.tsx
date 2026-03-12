'use client';

import { BookOpen, ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCourseById } from '@/lib/courseData';

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const course = getCourseById(courseId);

  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Обновить formData когда course загрузится
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description,
      });
    }
  }, [course]);

  if (!course) {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Очистить ошибку при изменении
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Описание обязательно';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Обновление курса
      const updatedCourse = {
        ...course,
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      // TODO: Сохранить в localStorage
      console.log('Обновление курса:', updatedCourse);

      // Перенаправление на страницу курса
      router.push(`/admin/courses/${courseId}`);
    } catch (error) {
      console.error('Ошибка обновления курса:', error);
      alert('Ошибка при обновлении курса');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (
      confirm(
        `Вы уверены, что хотите удалить курс "${course.title}"? Все модули и уроки будут удалены. Это действие нельзя отменить.`
      )
    ) {
      // TODO: Реализовать удаление через localStorage
      console.log('Удаление курса:', courseId);
      router.push('/admin/courses');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/courses/${courseId}`}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary-600" />
            Редактирование курса
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">{course.title}</p>
        </div>
      </div>

      {/* Форма редактирования */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Основная информация</h2>

          {/* Название */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Название курса <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
              placeholder="Например: Мастер бровист PRO"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Описание */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Описание курса <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none`}
              placeholder="Опишите, что студенты узнают и чему научатся..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Примечание о тарифах */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Примечание:</strong> Управление тарифными планами будет доступно в следующей версии.
              Текущие тарифные планы: {course?.pricingPlans?.length || 0}
            </p>
          </div>
        </div>

        {/* Информация о курсе */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Статистика курса</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Модулей: {course.modules.length}</li>
                <li>
                  • Уроков:{' '}
                  {course.modules.reduce((sum, module) => sum + module.lessons.length, 0)}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center justify-center gap-2 px-6 py-3 text-red-600 bg-white border border-red-300 hover:bg-red-50 active:bg-red-100 rounded-lg font-medium"
          >
            <Trash2 className="w-5 h-5" />
            Удалить курс
          </button>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              href={`/admin/courses/${courseId}`}
              className="px-6 py-3 text-center text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 rounded-lg font-medium"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
