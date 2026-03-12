'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { getCourseById } from '@/lib/courseData';
import { savePricingPlan, getCoursePricingPlans } from '@/lib/pricing';
import { ACCESS_PERIOD_OPTIONS, createAccessPeriod } from '@/lib/pricing';
import type { AccessPeriodType, PricingPlan } from '@/types';

export default function CreatePricingPlanPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const course = getCourseById(courseId);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    accessPeriod: '1month' as AccessPeriodType,
    price: '',
    currency: 'KZT',
    isActive: true,
    isRecommended: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <DollarSign className="w-16 h-16 text-gray-400 mb-4" />
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
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }
    
    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = 'Укажите корректную цену (больше 0)';
    }
    
    if (isNaN(Number(formData.price))) {
      newErrors.price = 'Цена должна быть числом';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      // Получить существующие планы для определения order
      const existingPlans = getCoursePricingPlans(courseId);
      const maxOrder = existingPlans.length > 0 
        ? Math.max(...existingPlans.map(p => p.order))
        : 0;
      
      const newPlan: PricingPlan = {
        id: `plan-${Date.now()}`,
        courseId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        accessPeriod: createAccessPeriod(formData.accessPeriod),
        price: Number(formData.price),
        currency: formData.currency,
        isActive: formData.isActive,
        isRecommended: formData.isRecommended,
        order: maxOrder + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      savePricingPlan(newPlan);
      router.push(`/admin/courses/${courseId}/pricing`);
    } catch (error) {
      console.error('Ошибка создания тарифа:', error);
      alert('Ошибка при создании тарифа');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link
          href={`/admin/courses/${courseId}/pricing`}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-primary-600" />
            Создание тарифного плана
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">{course.title}</p>
        </div>
      </div>

      {/* Форма создания */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Основная информация</h2>

          {/* Название */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Название тарифа <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
              placeholder="Например: 1 месяц, Полный доступ, VIP"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Описание */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Описание (необязательно)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Краткое описание тарифа, преимущества..."
            />
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
          </div>

          {/* Цена и валюта */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
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

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Валюта
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="KZT">KZT (₸)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="RUB">RUB (₽)</option>
              </select>
            </div>
          </div>

          {/* Опции */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Активен (доступен для покупки)
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isRecommended"
                name="isRecommended"
                checked={formData.isRecommended}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isRecommended" className="text-sm font-medium text-gray-700">
                Рекомендуемый тариф (будет выделен при покупке)
              </label>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
          <Link
            href={`/admin/courses/${courseId}/pricing`}
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
            {isSubmitting ? 'Создание...' : 'Создать тариф'}
          </button>
        </div>
      </form>
    </div>
  );
}
