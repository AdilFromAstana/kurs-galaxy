'use client';

import { useSession } from '@/components/providers/SessionProvider';
import type { ExpirationInfo, PricingPlan } from '@/types';

interface UsePurchaseReturn {
  isPurchased: boolean;
  isLoading: boolean;
  purchase: (
    planId: string,
    courseId: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  hasAccess: (isFree: boolean) => boolean;
  expirationInfo: ExpirationInfo | null;
  currentPlan: PricingPlan | null;
}

const ACCESS_PERIOD_BACK_MAP: Record<string, { type: any; days: number | null; label: string }> = {
  ONE_MONTH: { type: '1month', days: 30, label: '1 месяц' },
  TWO_MONTHS: { type: '2months', days: 60, label: '2 месяца' },
  THREE_MONTHS: { type: '3months', days: 90, label: '3 месяца' },
  SIX_MONTHS: { type: '6months', days: 180, label: '6 месяцев' },
  TWELVE_MONTHS: { type: '12months', days: 365, label: '12 месяцев' },
  UNLIMITED: { type: 'unlimited', days: null, label: 'Бессрочный' },
};

export const usePurchase = (courseId: string): UsePurchaseReturn => {
  const session = useSession();

  const active = session.getActivePurchase(courseId);
  const isPurchased = !!active;

  const expirationInfo: ExpirationInfo | null = active
    ? (() => {
        if (!active.expiresAt) {
          return { isExpired: false, expiresAt: null, daysRemaining: null };
        }
        const expiresAtMs = new Date(active.expiresAt).getTime();
        const now = Date.now();
        const isExpired = expiresAtMs < now;
        return {
          isExpired,
          expiresAt: expiresAtMs,
          daysRemaining: isExpired ? 0 : Math.ceil((expiresAtMs - now) / (1000 * 60 * 60 * 24)),
        };
      })()
    : null;

  const currentPlan: PricingPlan | null = active
    ? {
        id: active.plan.id,
        courseId: active.plan.courseId,
        name: active.plan.name,
        description: active.plan.description ?? undefined,
        accessPeriod: ACCESS_PERIOD_BACK_MAP[active.plan.accessPeriod] ?? {
          type: 'unlimited',
          days: null,
          label: 'Бессрочный',
        },
        price: active.plan.price,
        currency: active.plan.currency,
        isActive: true,
        isRecommended: false,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    : null;

  const purchase = async (planId: string, _cId: string) => {
    const r = await session.buy(planId);
    if (!r.ok) {
      console.error('Покупка не удалась:', r.error);
    }
    return r;
  };

  const hasAccess = (isFree: boolean) => isFree || isPurchased;

  return {
    isPurchased,
    isLoading: session.isLoading,
    purchase,
    hasAccess,
    expirationInfo,
    currentPlan,
  };
};
