'use client';

import { BookOpen, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ACCESS_PERIOD_OPTIONS } from '@/lib/pricing';
import type { AccessPeriodType } from '@/types';

export default function CreateCoursePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'KZT',
    accessPeriod: '1month' as AccessPeriodType,  // По умолчанию 1 месяц
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!formData.price) {
      newErrors.price = 'Цена обязательна';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Цена должна быть положительным числом';
    }

    if (!formData.currency) {
      newErrors.currency = 'Валюта обязательна';
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
      // Получить информацию о выбранном периоде
      const periodOption = ACCESS_PERIOD_OPTIONS.find(opt => opt.value === formData.accessPeriod);
      
      // Создание нового курса
      const newCourse = {
        id: `course-${Date.now()}`,
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        currency: formData.currency,
        accessPeriod: formData.accessPeriod,  // Сохраняем выбранный период
        modules: [],
      };

      // TODO: Сохранить в localStorage
      console.log('Создание нового курса:', newCourse);
      console.log('Период доступа:', periodOption?.label);

      // Перенаправление на страницу курса
      router.push(`/admin/courses/${newCourse.id}`);
    } catch (error) {
      console.error('Ошибка создания курса:', error);
      alert('Ошибка при создании курса');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/courses"
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary-600" />
            Создание курса
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Заполните основную информацию о курсе
          </p>
        </div>
      </div>

      {/* Форма создания */}
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

          {/* Период доступа */}
          <div>
            <label htmlFor="accessPeriod" className="block text-sm font-medium text-gray-700 mb-2">
              Период доступа <span className="text-red-500">*</span>
            </label>
            <select
              id="accessPeriod"
              name="accessPeriod"
              value={formData.accessPeriod}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {ACCESS_PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Выберите, на какой срок студенты получат доступ к курсу после покупки
            </p>
          </div>

          {/* Цена и валюта */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Цена */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Цена <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="1"
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                } focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                placeholder="18000"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>

            {/* Валюта */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Валюта <span className="text-red-500">*</span>
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.currency ? 'border-red-300' : 'border-gray-300'
                } focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
              >
                <option value="KZT">KZT (Тенге)</option>
                <option value="RUB">RUB (Рубль)</option>
                <option value="USD">USD (Доллар)</option>
                <option value="EUR">EUR (Евро)</option>
              </select>
              {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency}</p>}
            </div>
          </div>
        </div>

        {/* Информационная панель */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Что дальше?</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• После создания курса вы сможете добавить модули</li>
                <li>• В каждый модуль можно добавить уроки с видео и материалами</li>
                <li>• Курс автоматически появится в каталоге</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center gap-4 justify-end">
          <Link
            href="/admin/courses"
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 rounded-lg font-medium"
          >
            Отмена
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? 'Создание...' : 'Создать курс'}
          </button>
        </div>
      </form>
    </div>
  );
}
