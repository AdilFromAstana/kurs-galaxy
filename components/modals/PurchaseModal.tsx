'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, Sparkles, Check } from 'lucide-react';
import { usePurchase } from '@/hooks/usePurchase';
import { getCourseWithPricing } from '@/lib/courseData';
import type { PricingPlan, Course } from '@/types';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  courseId: string;
}

export default function PurchaseModal({
  isOpen,
  onClose,
  onSuccess,
  courseId
}: PurchaseModalProps) {
  const { purchase } = usePurchase(courseId);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    const loadedCourse = getCourseWithPricing(courseId);
    setCourse(loadedCourse || null);
  }, [courseId]);

  if (!isOpen) return null;

  const handlePurchase = () => {
    if (!selectedPlan) {
      alert('Выберите тарифный план');
      return;
    }
    
    purchase(selectedPlan, courseId);
    onSuccess?.();
    onClose();
  };

  const features = [
    'Доступ ко всем урокам курса',
    'Именной сертификат после завершения',
    'Дополнительные материалы к урокам',
    'Постоянные обновления контента',
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors touch-target"
          aria-label="Закрыть"
        >
          <X className="w-6 h-6 text-dark-600" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
            <Sparkles className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-dark-900 mb-2">
            Выберите тарифный план
          </h2>
          <p className="text-base md:text-lg text-dark-600">
            Получите доступ к курсу на удобный для вас период
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {course?.pricingPlans?.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all ${
                selectedPlan === plan.id
                  ? 'border-primary-600 bg-primary-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-primary-300'
              } ${plan.isRecommended ? 'ring-2 ring-primary-600' : ''}`}
            >
              {/* Recommended Badge */}
              {plan.isRecommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Рекомендуется
                  </span>
                </div>
              )}

              {/* Selected Indicator */}
              {selectedPlan === plan.id && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-xl font-bold text-dark-900 mb-2 text-center">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="text-center mb-3">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-dark-900">
                    {plan.price.toLocaleString()}
                  </span>
                  <span className="text-lg text-dark-600">{plan.currency}</span>
                </div>
              </div>

              {/* Access Period */}
              <div className="text-center mb-4">
                <span className="text-sm text-dark-600">
                  Доступ: <span className="font-semibold">{plan.accessPeriod.label}</span>
                </span>
              </div>

              {/* Description */}
              {plan.description && (
                <p className="text-sm text-dark-600 text-center">
                  {plan.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="mb-6 space-y-2">
          <h3 className="font-semibold text-dark-900 mb-3">Что входит в курс:</h3>
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-primary-600" />
              </div>
              <p className="text-sm text-dark-700">{feature}</p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePurchase}
            disabled={!selectedPlan}
            className="btn btn-primary flex-1 text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Оплатить
          </button>
          <button
            onClick={onClose}
            className="btn btn-secondary flex-1 sm:flex-initial"
          >
            Позже
          </button>
        </div>

        {/* Security Info */}
        <div className="mt-4 text-center text-xs md:text-sm text-dark-500">
          🔒 Безопасная оплата
        </div>
      </div>
    </div>
  );
}
