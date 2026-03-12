export interface NailUser {
  name: string;
  email: string;
  password?: string;
}

export interface Material {
  title: string;
  url: string;
  type: 'pdf' | 'link' | 'product';
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  isFree: boolean;
  videoUrl: string;
  content: string;
  materials: Material[];
  moduleId: string;
  order?: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order?: number;
}

// Тип периода доступа
export type AccessPeriodType = '1month' | '2months' | '3months' | '6months' | '12months' | 'unlimited';

// Тарифный план курса
export interface PricingPlan {
  id: string;
  courseId: string;
  name: string;
  description?: string;
  accessPeriod: {
    type: AccessPeriodType;
    days: number | null;
    label: string;
  };
  price: number;
  currency: string;
  isActive: boolean;
  isRecommended: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Доступ пользователя к курсу
export interface UserCourseAccess {
  id: string;
  userId: string;
  courseId: string;
  pricingPlanId: string;
  status: 'active' | 'expired' | 'cancelled';
  purchasedAt: Date;
  activatedAt?: Date;
  expiresAt?: Date;
  paymentAmount: number;
  paymentCurrency: string;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  progress: {
    completedLessons: string[];
    lastAccessedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  pricingPlans: PricingPlan[];  // ✅ Основной источник цен
}

// Данные о покупке курса
export interface PurchaseData {
  planId: string;           // ID тарифного плана
  courseId: string;         // ID курса
  purchasedAt: number;      // Дата покупки (timestamp)
  expiresAt: number | null; // Дата истечения (timestamp) или null для unlimited
  status: 'active' | 'expired' | 'cancelled';
}

// Информация об истечении доступа
export interface ExpirationInfo {
  isExpired: boolean;
  expiresAt: number | null;
  daysRemaining: number | null;
}

export interface LocalStorageSchema {
  nail_user: NailUser | null;
  nail_purchased: boolean;
  nail_progress: string[];
  nail_last_lesson: string | null;
}
