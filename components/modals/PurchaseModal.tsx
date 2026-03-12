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

  // Блокировка скролла body при открытой модалке
  useEffect(() => {
    if (isOpen) {
      // Блокируем скролл body
      document.body.style.overflow = 'hidden';
      // Для iOS Safari
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Возвращаем скролл
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Cleanup при размонтировании
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

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
      <div className="modal-content max-w-sm md:max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors touch-target"
          aria-label="Закрыть"
        >
          <X className="w-6 h-6 text-dark-600" />
        </button>

        {/* Header */}
        <div className="text-center mb-3 md:mb-6">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4 shadow-lg shadow-primary-500/30">
            <Sparkles className="w-6 h-6 md:w-9 md:h-9 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-dark-900 mb-1 md:mb-2">
            Выберите тарифный план
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-dark-600 leading-snug">
            Получите доступ к курсу на удобный для вас период
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-6">
          {course?.pricingPlans?.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative cursor-pointer rounded-xl border-2 p-3 md:p-5 transition-all ${
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
              <h3 className="text-base md:text-lg lg:text-xl font-bold text-dark-900 mb-1 md:mb-2 text-center leading-tight">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="text-center mb-2 md:mb-3">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl md:text-3xl font-bold text-dark-900">
                    {plan.price.toLocaleString()}
                  </span>
                  <span className="text-base md:text-lg text-dark-600">{plan.currency}</span>
                </div>
              </div>

              {/* Access Period */}
              <div className="text-center mb-2 md:mb-4">
                <span className="text-xs md:text-sm text-dark-600">
                  Доступ: <span className="font-semibold">{plan.accessPeriod.label}</span>
                </span>
              </div>

              {/* Description */}
              {plan.description && (
                <p className="text-xs md:text-sm text-dark-600 text-center leading-snug">
                  {plan.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="mb-3 md:mb-6 space-y-1 md:space-y-2">
          <h3 className="text-sm md:text-base font-semibold text-dark-900 mb-2 md:mb-3">Что входит в курс:</h3>
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2 md:gap-3">
              <div className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary-600" />
              </div>
              <p className="text-xs md:text-sm text-dark-700 leading-snug">{feature}</p>
            </div>
          ))}
        </div>

        {/* CTA Buttons - Sticky на мобилке */}
        <div className="sticky bottom-0 left-0 right-0 bg-white pt-3 pb-2 -mx-4 px-4 md:static md:mx-0 md:px-0 md:pt-0 md:pb-0 border-t md:border-t-0 border-gray-100">
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <button
              onClick={handlePurchase}
              disabled={!selectedPlan}
              className="btn btn-primary flex-1 text-sm md:text-base lg:text-lg !py-2.5 md:!py-3 lg:!py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Оплатить
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary flex-1 sm:flex-initial text-sm md:text-base !py-2.5 md:!py-3 lg:!py-4"
            >
              Позже
            </button>
          </div>

          {/* Security Info */}
          <div className="mt-2 text-center text-xs text-dark-500">
            🔒 Безопасная оплата
          </div>
        </div>
      </div>
    </div>
  );
}
