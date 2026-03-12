'use client';

import { useState, useEffect } from 'react';
import {
  getPurchase,
  setPurchase,
  isPurchaseActive,
  getExpirationInfo,
  migrateOldPurchases
} from '@/lib/storage';
import { getCourseWithPricing } from '@/lib/courseData';
import type { PurchaseData, ExpirationInfo, PricingPlan } from '@/types';

interface UsePurchaseReturn {
  isPurchased: boolean;
  isLoading: boolean;
  purchase: (planId: string, courseId: string) => void;
  hasAccess: (isFree: boolean) => boolean;
  expirationInfo: ExpirationInfo | null;
  currentPlan: PricingPlan | null;
}

export const usePurchase = (courseId: string): UsePurchaseReturn => {
  const [isPurchased, setIsPurchasedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expirationInfo, setExpirationInfo] = useState<ExpirationInfo | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PricingPlan | null>(null);

  useEffect(() => {
    // Миграция старых данных
    migrateOldPurchases();
    
    // Проверка покупки
    const active = isPurchaseActive(courseId);
    setIsPurchasedState(active);
    
    // Получение информации об истечении
    const info = getExpirationInfo(courseId);
    setExpirationInfo(info);
    
    // Получение текущего плана
    if (active) {
      const purchaseData = getPurchase(courseId);
      if (purchaseData) {
        const course = getCourseWithPricing(courseId);
        const plan = course?.pricingPlans?.find(p => p.id === purchaseData.planId);
        setCurrentPlan(plan || null);
      }
    }
    
    setIsLoading(false);
  }, [courseId]);

  const purchase = (planId: string, cId: string): void => {
    const course = getCourseWithPricing(cId);
    const plan = course?.pricingPlans?.find(p => p.id === planId);
    
    if (!plan) {
      console.error('План не найден:', planId);
      return;
    }
    
    // Вычисление даты истечения
    let expiresAt: number | null = null;
    
    if (plan.accessPeriod.type !== 'unlimited' && plan.accessPeriod.days) {
      const now = Date.now();
      expiresAt = now + (plan.accessPeriod.days * 24 * 60 * 60 * 1000);
    }
    
    const purchaseData: PurchaseData = {
      planId,
      courseId: cId,
      purchasedAt: Date.now(),
      expiresAt,
      status: 'active'
    };
    
    setPurchase(cId, purchaseData);
    setIsPurchasedState(true);
    setCurrentPlan(plan);
    
    const info = getExpirationInfo(cId);
    setExpirationInfo(info);
  };

  const hasAccess = (isFree: boolean): boolean => {
    return isFree || isPurchased;
  };

  return {
    isPurchased,
    isLoading,
    purchase,
    hasAccess,
    expirationInfo,
    currentPlan,
  };
};
