import { NailUser, PurchaseData, ExpirationInfo } from '@/types';

export const StorageKeys = {
  USER: 'nail_user',
  PURCHASED: 'nail_purchased',           // ❌ Устаревший (оставить для миграции)
  PURCHASES: 'nail_purchases',           // ✅ Новый (объект с purchase по courseId)
  PROGRESS: 'nail_progress',
  LAST_LESSON: 'nail_last_lesson',
} as const;

// User
export const getUser = (): NailUser | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(StorageKeys.USER);
  return data ? JSON.parse(data) : null;
};

export const setUser = (user: NailUser): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(StorageKeys.USER, JSON.stringify(user));
};

export const clearUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(StorageKeys.USER);
};

// ===== НОВЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С ПОКУПКАМИ =====

// Получить покупку курса
export const getPurchase = (courseId: string): PurchaseData | null => {
  if (typeof window === 'undefined') return null;
  const purchases = getAllPurchases();
  return purchases[courseId] || null;
};

// Сохранить покупку курса
export const setPurchase = (courseId: string, purchase: PurchaseData): void => {
  if (typeof window === 'undefined') return;
  const purchases = getAllPurchases();
  purchases[courseId] = purchase;
  localStorage.setItem(StorageKeys.PURCHASES, JSON.stringify(purchases));
};

// Получить все покупки
export const getAllPurchases = (): Record<string, PurchaseData> => {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(StorageKeys.PURCHASES);
  return data ? JSON.parse(data) : {};
};

// Проверить активность покупки
export const isPurchaseActive = (courseId: string): boolean => {
  const purchase = getPurchase(courseId);
  if (!purchase) return false;
  
  // Проверка статуса
  if (purchase.status !== 'active') return false;
  
  // Проверка срока (для не-unlimited планов)
  if (purchase.expiresAt && purchase.expiresAt < Date.now()) {
    // Автоматически истек
    purchase.status = 'expired';
    setPurchase(courseId, purchase);
    return false;
  }
  
  return true;
};

// Получить информацию об истечении
export const getExpirationInfo = (courseId: string): ExpirationInfo => {
  const purchase = getPurchase(courseId);
  
  if (!purchase || !purchase.expiresAt) {
    return {
      isExpired: false,
      expiresAt: null,
      daysRemaining: null
    };
  }
  
  const now = Date.now();
  const isExpired = purchase.expiresAt < now;
  const daysRemaining = isExpired
    ? 0
    : Math.ceil((purchase.expiresAt - now) / (1000 * 60 * 60 * 24));
  
  return {
    isExpired,
    expiresAt: purchase.expiresAt,
    daysRemaining
  };
};

// Миграция старых данных
export const migrateOldPurchases = (): void => {
  if (typeof window === 'undefined') return;
  
  const oldPurchased = localStorage.getItem(StorageKeys.PURCHASED);
  
  if (oldPurchased === 'true') {
    // Была старая покупка - создаем новую с бессрочным доступом
    const migration: PurchaseData = {
      planId: 'plan-unlimited',
      courseId: 'brow-master-pro',
      purchasedAt: Date.now(),
      expiresAt: null,
      status: 'active'
    };
    
    setPurchase('brow-master-pro', migration);
    
    // Удаляем старый ключ
    localStorage.removeItem(StorageKeys.PURCHASED);
    
    console.log('✅ Миграция покупки завершена');
  }
};

// ===== УСТАРЕВШИЕ ФУНКЦИИ (для обратной совместимости) =====

// @deprecated Используйте isPurchaseActive(courseId)
export const isPurchased = (): boolean => {
  console.warn('isPurchased() устарела, используйте isPurchaseActive(courseId)');
  return isPurchaseActive('brow-master-pro');
};

// @deprecated Используйте setPurchase(courseId, purchaseData)
export const setPurchased = (value: boolean): void => {
  console.warn('setPurchased() устарела, используйте setPurchase(courseId, purchaseData)');
  if (value) {
    const purchase: PurchaseData = {
      planId: 'plan-unlimited',
      courseId: 'brow-master-pro',
      purchasedAt: Date.now(),
      expiresAt: null,
      status: 'active'
    };
    setPurchase('brow-master-pro', purchase);
  }
};

// ===== ПРОГРЕСС ПО КУРСАМ =====

// Типы для прогресса
type ProgressByCourse = Record<string, string[]>;
type LastLessonByCourse = Record<string, string>;

// Получить весь прогресс (объект с прогрессом по каждому курсу)
export const getAllProgress = (): ProgressByCourse => {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(StorageKeys.PROGRESS);
  
  if (!data) return {};
  
  try {
    const parsed = JSON.parse(data);
    
    // Миграция старого формата (массив) в новый (объект)
    if (Array.isArray(parsed)) {
      const migrated = { 'brow-master-pro': parsed };
      localStorage.setItem(StorageKeys.PROGRESS, JSON.stringify(migrated));
      return migrated;
    }
    
    return parsed;
  } catch (error) {
    console.error('Ошибка загрузки прогресса:', error);
    return {};
  }
};

// Сохранить весь прогресс
export const setAllProgress = (progress: ProgressByCourse): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(StorageKeys.PROGRESS, JSON.stringify(progress));
};

// Получить прогресс конкретного курса
export const getProgress = (courseId: string = 'brow-master-pro'): string[] => {
  const allProgress = getAllProgress();
  return allProgress[courseId] || [];
};

// Установить прогресс конкретного курса
export const setProgress = (courseId: string, progress: string[]): void => {
  const allProgress = getAllProgress();
  allProgress[courseId] = progress;
  setAllProgress(allProgress);
};

// Добавить урок к прогрессу
export const addToProgress = (lessonId: string, courseId: string = 'brow-master-pro'): void => {
  const progress = getProgress(courseId);
  if (!progress.includes(lessonId)) {
    progress.push(lessonId);
    setProgress(courseId, progress);
  }
};

// Проверить, завершен ли урок
export const isLessonCompleted = (lessonId: string, courseId: string = 'brow-master-pro'): boolean => {
  return getProgress(courseId).includes(lessonId);
};

// Last Lesson (по курсам)
export const getAllLastLessons = (): LastLessonByCourse => {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(StorageKeys.LAST_LESSON);
  
  if (!data) return {};
  
  try {
    const parsed = JSON.parse(data);
    
    // Миграция старого формата (строка) в новый (объект)
    if (typeof parsed === 'string') {
      // Старое значение было строкой - мигрируем в объект для курса по умолчанию
      const migrated = { 'brow-master-pro': parsed };
      localStorage.setItem(StorageKeys.LAST_LESSON, JSON.stringify(migrated));
      return migrated;
    }
    
    return parsed;
  } catch (error) {
    console.error('Ошибка загрузки последнего урока:', error);
    return {};
  }
};

export const setAllLastLessons = (lastLessons: LastLessonByCourse): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(StorageKeys.LAST_LESSON, JSON.stringify(lastLessons));
};

export const getLastLesson = (courseId: string = 'brow-master-pro'): string | null => {
  const allLastLessons = getAllLastLessons();
  return allLastLessons[courseId] || null;
};

export const setLastLesson = (lessonId: string, courseId: string = 'brow-master-pro'): void => {
  const allLastLessons = getAllLastLessons();
  allLastLessons[courseId] = lessonId;
  setAllLastLessons(allLastLessons);
};

// Video Position
export const getVideoTime = (lessonId: string): number => {
  if (typeof window === 'undefined') return 0;
  const time = localStorage.getItem(`nail_lesson_${lessonId}_time`);
  return time ? parseFloat(time) : 0;
};

export const setVideoTime = (lessonId: string, time: number): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`nail_lesson_${lessonId}_time`, time.toString());
};

// Clear All
export const clearAll = (): void => {
  if (typeof window === 'undefined') return;
  Object.values(StorageKeys).forEach(key => {
    localStorage.removeItem(key);
  });
};
