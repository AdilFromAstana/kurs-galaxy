'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, DollarSign } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { confirmToast } from '@/lib/toastConfirm';
import { ACCESS_PERIOD_OPTIONS } from '@/lib/pricing';
import type { AccessPeriodType } from '@/types';

const PERIOD_TO_ENUM: Record<AccessPeriodType, string> = {
  '1month': 'ONE_MONTH',
  '2months': 'TWO_MONTHS',
  '3months': 'THREE_MONTHS',
  '6months': 'SIX_MONTHS',
  '12months': 'TWELVE_MONTHS',
  unlimited: 'UNLIMITED',
};

const ENUM_TO_PERIOD: Record<string, AccessPeriodType> = Object.fromEntries(
  Object.entries(PERIOD_TO_ENUM).map(([k, v]) => [v, k as AccessPeriodType])
);

type PlanDTO = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  isActive: boolean;
  isRecommended: boolean;
  accessPeriod: string;
};

type CourseLite = { id: string; slug: string; title: string };

export default function EditPricingPlanPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const planId = params.planId as string;

  const [course, setCourse] = useState<CourseLite | null>(null);
  const [plan, setPlan] = useState<PlanDTO | null>(null);
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [courseRes, planRes] = await Promise.all([
          fetch(`/api/admin/courses/${courseId}`, { credentials: 'include' }),
          fetch(`/api/admin/pricing/${planId}`, { credentials: 'include' }),
        ]);
        if (cancel) return;
        if (courseRes.ok) {
          const cd = await courseRes.json();
          setCourse({ id: cd.course.id, slug: cd.course.slug, title: cd.course.title });
        }
        if (planRes.ok) {
          const pd = await planRes.json();
          const p = pd.plan as PlanDTO;
          setPlan(p);
          setFormData({
            name: p.name,
            description: p.description ?? '',
            accessPeriod: (ENUM_TO_PERIOD[p.accessPeriod] ?? '1month') as AccessPeriodType,
            price: String(p.price),
            currency: p.currency,
            isActive: p.isActive,
            isRecommended: p.isRecommended,
          });
        }
      } finally {
        setIsLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [courseId, planId]);

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600">Загрузка...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <DollarSign className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Тариф не найден</h2>
        <p className="text-gray-600 mb-6">Тариф с ID "{planId}" не существует</p>
        <Link
          href={`/admin/courses/${courseId}/pricing`}
          className="px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium"
        >
          К списку тарифов
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
    if (!validate() || !plan) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/pricing/${plan.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          accessPeriod: PERIOD_TO_ENUM[formData.accessPeriod],
          price: Number(formData.price),
          currency: formData.currency,
          isActive: formData.isActive,
          isRecommended: formData.isRecommended,
        }),
      });
      if (!res.ok) {
        toast.error('Ошибка при обновлении тарифа');
        return;
      }
      toast.success('Тариф обновлён');
      router.push(`/admin/courses/${courseId}/pricing`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    const ok = await confirmToast({
      message: `Удалить тарифный план «${plan.name}»?`,
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/pricing/${plan.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      toast.success('Тариф удалён');
      router.push(`/admin/courses/${courseId}/pricing`);
    } else {
      toast.error('Ошибка при удалении тарифа');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
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
            Редактирование тарифа
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
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center justify-center gap-2 px-6 py-3 text-red-600 bg-white border border-red-300 hover:bg-red-50 active:bg-red-100 rounded-lg font-medium"
          >
            <Trash2 className="w-5 h-5" />
            Удалить тариф
          </button>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
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
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
