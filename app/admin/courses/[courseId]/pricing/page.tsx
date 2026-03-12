'use client';

import { DollarSign, Plus, Edit, Trash2, ArrowLeft, Check, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCourseById } from '@/lib/courseData';
import { getCoursePricingPlans, deletePricingPlan, savePricingPlan } from '@/lib/pricing';
import type { PricingPlan } from '@/types';

export default function CoursePricingPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const course = getCourseById(courseId);
  
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadPlans = () => {
      try {
        // Сначала пытаемся загрузить из localStorage
        const storedPlans = getCoursePricingPlans(courseId);
        
        if (storedPlans.length > 0) {
          setPlans(storedPlans.sort((a, b) => a.order - b.order));
        } else {
          // Если в localStorage нет, используем дефолтные из courseData
          const currentCourse = getCourseById(courseId);
          if (currentCourse?.pricingPlans) {
            setPlans(currentCourse.pricingPlans.sort((a, b) => a.order - b.order));
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки тарифов:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPlans();
  }, [courseId]);
  
  const handleToggleActive = (plan: PricingPlan) => {
    try {
      const updated = { ...plan, isActive: !plan.isActive, updatedAt: new Date() };
      savePricingPlan(updated);
      setPlans(plans.map(p => p.id === plan.id ? updated : p));
    } catch (error) {
      console.error('Ошибка обновления тарифа:', error);
      alert('Ошибка при обновлении тарифа');
    }
  };
  
  const handleDelete = (planId: string, planName: string) => {
    if (confirm(`Удалить тарифный план "${planName}"? Это действие нельзя отменить.`)) {
      try {
        deletePricingPlan(courseId, planId);
        setPlans(plans.filter(p => p.id !== planId));
      } catch (error) {
        console.error('Ошибка удаления тарифа:', error);
        alert('Ошибка при удалении тарифа');
      }
    }
  };
  
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

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
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
          <p className="text-gray-600 mt-1 text-sm md:text-base">{course.title}</p>
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
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
                className="border rounded-lg p-4 hover:border-primary-300 transition-colors bg-gray-50"
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
                      Доступ: {plan.accessPeriod.label}
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
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
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
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
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
