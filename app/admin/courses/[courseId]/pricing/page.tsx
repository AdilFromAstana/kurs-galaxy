'use client';

import { DollarSign, Plus, Edit, Trash2, ArrowLeft, Check, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { confirmToast } from '@/lib/toastConfirm';

const ACCESS_LABEL: Record<string, string> = {
  ONE_MONTH: '1 месяц',
  TWO_MONTHS: '2 месяца',
  THREE_MONTHS: '3 месяца',
  SIX_MONTHS: '6 месяцев',
  TWELVE_MONTHS: '12 месяцев',
  UNLIMITED: 'Бессрочный',
};

type PlanDTO = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  isActive: boolean;
  isRecommended: boolean;
  accessPeriod: string;
  order: number;
};

type CourseLite = { id: string; slug: string; title: string };

export default function CoursePricingPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<CourseLite | null>(null);
  const [plans, setPlans] = useState<PlanDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const [courseRes, plansRes] = await Promise.all([
        fetch(`/api/admin/courses/${courseId}`, { credentials: 'include' }),
        fetch(`/api/admin/courses/${courseId}/pricing`, { credentials: 'include' }),
      ]);
      if (cancel) return;
      if (courseRes.ok) {
        const cd = await courseRes.json();
        setCourse({ id: cd.course.id, slug: cd.course.slug, title: cd.course.title });
      }
      if (plansRes.ok) {
        const pd = await plansRes.json();
        setPlans((pd.pricingPlans ?? []).sort((a: PlanDTO, b: PlanDTO) => a.order - b.order));
      }
      setIsLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [courseId]);

  const handleToggleActive = async (plan: PlanDTO) => {
    const res = await fetch(`/api/admin/pricing/${plan.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !plan.isActive }),
    });
    if (!res.ok) {
      toast.error('Ошибка при обновлении тарифа');
      return;
    }
    setPlans(plans.map((p) => (p.id === plan.id ? { ...p, isActive: !plan.isActive } : p)));
  };

  const handleDelete = async (planId: string, planName: string) => {
    const ok = await confirmToast({
      message: `Удалить тарифный план «${planName}»?`,
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/pricing/${planId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      toast.error('Ошибка при удалении тарифа');
      return;
    }
    setPlans(plans.filter((p) => p.id !== planId));
    toast.success('Тариф удалён');
  };

  if (!isLoading && !course) {
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

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link
          href={`/admin/courses/${courseId}`}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-primary-600" />
            Управление тарифами
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">{course?.title ?? ''}</p>
        </div>
        <Link
          href={`/admin/courses/${courseId}/pricing/create`}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Создать тариф
        </Link>
      </div>

      {/* Тарифные планы */}
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Тарифные планы ({plans.length})
        </h3>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Загрузка...</p>
          </div>
        ) : plans.length > 0 ? (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-soft p-4 hover:border-primary-200 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* План info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-lg">{plan.name}</h4>
                      {plan.isRecommended && (
                        <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded">
                          Рекомендуется
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-primary-600 mb-1">
                      {plan.price.toLocaleString()} {plan.currency}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Доступ: {ACCESS_LABEL[plan.accessPeriod] ?? plan.accessPeriod}
                    </p>
                    {plan.description && (
                      <p className="text-sm text-gray-500">{plan.description}</p>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Статус */}
                    <button
                      onClick={() => handleToggleActive(plan)}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        plan.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {plan.isActive ? (
                        <>
                          <Check className="w-4 h-4" />
                          Активен
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          Неактивен
                        </>
                      )}
                    </button>

                    {/* Редактировать */}
                    <Link
                      href={`/admin/courses/${courseId}/pricing/${plan.id}/edit`}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 rounded-lg font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Редактировать
                    </Link>

                    {/* Удалить */}
                    <button
                      onClick={() => handleDelete(plan.id, plan.name)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 active:bg-red-800 rounded-lg font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Нет тарифных планов</h4>
            <p className="text-gray-600 mb-4">Создайте первый тарифный план для этого курса</p>
            <Link
              href={`/admin/courses/${courseId}/pricing/create`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium"
            >
              <Plus className="w-5 h-5" />
              Создать тариф
            </Link>
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">О тарифных планах</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Тарифы определяют стоимость и период доступа к курсу</li>
              <li>• Отключенные тарифы не отображаются при покупке</li>
              <li>• Рекомендуемый тариф выделяется при покупке</li>
              <li>• Изменения применяются сразу для новых покупок</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
