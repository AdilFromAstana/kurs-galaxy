import type { AccessPeriodType, PricingPlan } from '@/types';

// Константы периодов доступа
export const ACCESS_PERIODS: Record<AccessPeriodType, { days: number | null; label: string }> = {
  '1month': { days: 30, label: '1 месяц' },
  '2months': { days: 60, label: '2 месяца' },
  '3months': { days: 90, label: '3 месяца' },
  '6months': { days: 180, label: '6 месяцев' },
  '12months': { days: 365, label: '12 месяцев' },
  'unlimited': { days: null, label: 'Бессрочный' }
};

// Опции для дропдауна
export const ACCESS_PERIOD_OPTIONS = [
  { value: '1month' as AccessPeriodType, label: '1 месяц (30 дней)' },
  { value: '2months' as AccessPeriodType, label: '2 месяца (60 дней)' },
  { value: '3months' as AccessPeriodType, label: '3 месяца (90 дней)' },
  { value: '6months' as AccessPeriodType, label: '6 месяцев (180 дней)' },
  { value: '12months' as AccessPeriodType, label: '12 месяцев (365 дней)' },
  { value: 'unlimited' as AccessPeriodType, label: 'Бессрочный (навсегда)' }
];

// Получить информацию о периоде
export function getAccessPeriodInfo(type: AccessPeriodType) {
  return ACCESS_PERIODS[type];
}

// Создать объект accessPeriod
export function createAccessPeriod(type: AccessPeriodType) {
  const info = ACCESS_PERIODS[type];
  return {
    type,
    days: info.days,
    label: info.label
  };
}

// Получить все тарифы курса
export function getCoursePricingPlans(courseId: string): PricingPlan[] {
  // TODO: Загрузить из localStorage
  const stored = localStorage.getItem(`nail_pricing_${courseId}`);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

// Сохранить тариф
export function savePricingPlan(plan: PricingPlan): void {
  const plans = getCoursePricingPlans(plan.courseId);
  const existingIndex = plans.findIndex(p => p.id === plan.id);
  
  if (existingIndex >= 0) {
    plans[existingIndex] = plan;
  } else {
    plans.push(plan);
  }
  
  localStorage.setItem(`nail_pricing_${plan.courseId}`, JSON.stringify(plans));
}

// Удалить тариф
export function deletePricingPlan(courseId: string, planId: string): void {
  const plans = getCoursePricingPlans(courseId);
  const filtered = plans.filter(p => p.id !== planId);
  localStorage.setItem(`nail_pricing_${courseId}`, JSON.stringify(filtered));
}

// Получить активные тарифы
export function getActivePricingPlans(courseId: string): PricingPlan[] {
  return getCoursePricingPlans(courseId)
    .filter(p => p.isActive)
    .sort((a, b) => a.order - b.order);
}
