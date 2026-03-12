# План реализации управления тарифными планами

## 🎯 Цель
Реализовать полный цикл управления тарифными планами курсов согласно **Варианту 1** (раздельное управление).

---

## 📋 Этапы реализации

### **Этап 1: Исправление критичной проблемы с данными** ⚡ ПРИОРИТЕТ

#### 1.1 Обновить `lib/courseData.ts`
**Файл:** `nail-academy-pro/lib/courseData.ts`

**Действия:**
```typescript
// Добавить функцию синхронизации с localStorage
export const getCourseWithPricing = (courseId: string): Course | undefined => {
  const course = coursesData.find(c => c.id === courseId);
  if (!course) return undefined;
  
  // Попытка загрузки тарифов из localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`nail_pricing_${courseId}`);
    if (stored) {
      try {
        const pricingPlans = JSON.parse(stored);
        return {
          ...course,
          pricingPlans
        };
      } catch (error) {
        console.error('Ошибка парсинга тарифов:', error);
      }
    }
  }
  
  return course;
};

// Обновить getCourseById
export const getCourseById = (courseId: string) => {
  return getCourseWithPricing(courseId);
};
```

**Зависимости:** нет  
**Время:** 30 минут  
**Критичность:** 🔴 Критично

---

#### 1.2 Обновить `hooks/usePurchase.ts`
**Файл:** `nail-academy-pro/hooks/usePurchase.ts`

**Действия:**
```typescript
import { getCourseWithPricing } from '@/lib/courseData';

// Заменить coursesData.find() на getCourseWithPricing()
const course = getCourseWithPricing(courseId);
```

**Зависимости:** Этап 1.1  
**Время:** 15 минут  
**Критичность:** 🔴 Критично

---

#### 1.3 Обновить `components/modals/PurchaseModal.tsx`
**Файл:** `nail-academy-pro/components/modals/PurchaseModal.tsx`

**Действия:**
```typescript
import { getCourseWithPricing } from '@/lib/courseData';

// Внутри компонента использовать динамическую загрузку
const [course, setCourse] = useState<Course | null>(null);

useEffect(() => {
  const loadedCourse = getCourseWithPricing(courseId);
  setCourse(loadedCourse || null);
}, [courseId]);

// Использовать course вместо courseData
{course?.pricingPlans?.map((plan) => (...))}
```

**Зависимости:** Этап 1.1  
**Время:** 20 минут  
**Критичность:** 🔴 Критично

---

### **Этап 2: Обновление существующих страниц**

#### 2.1 Добавить кнопку управления тарифами
**Файл:** `nail-academy-pro/app/admin/courses/[courseId]/page.tsx`

**Действия:**
```tsx
// В секции "Тарифные планы" (строка 169-210)
<div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-bold text-gray-900">
    Тарифные планы ({course.pricingPlans?.length || 0})
  </h3>
  <Link
    href={`/admin/courses/${courseId}/pricing`}
    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 rounded-lg font-medium text-sm"
  >
    <DollarSign className="w-4 h-4" />
    Управление
  </Link>
</div>
```

**Зависимости:** нет  
**Время:** 10 минут  
**Критичность:** 🟡 Средняя

---

### **Этап 3: Создание страниц управления тарифами**

#### 3.1 Страница списка тарифов
**Файл:** `nail-academy-pro/app/admin/courses/[courseId]/pricing/page.tsx`

**Функционал:**
- Отображение всех тарифов курса
- Drag & drop для изменения порядка
- Кнопки редактирования и удаления
- Переключатель активности (isActive)
- Кнопка создания нового тарифа

**Структура:**
```tsx
'use client';

import { DollarSign, Plus, Edit, Trash2, GripVertical } from 'lucide-react';
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
  
  useEffect(() => {
    const loadedPlans = getCoursePricingPlans(courseId);
    setPlans(loadedPlans.sort((a, b) => a.order - b.order));
  }, [courseId]);
  
  const handleToggleActive = (plan: PricingPlan) => {
    const updated = { ...plan, isActive: !plan.isActive, updatedAt: new Date() };
    savePricingPlan(updated);
    setPlans(plans.map(p => p.id === plan.id ? updated : p));
  };
  
  const handleDelete = (planId: string) => {
    if (confirm('Удалить тарифный план?')) {
      deletePricingPlan(courseId, planId);
      setPlans(plans.filter(p => p.id !== planId));
    }
  };
  
  // Render UI
}
```

**Зависимости:** Этап 1  
**Время:** 2-3 часа  
**Критичность:** 🔴 Критично

---

#### 3.2 Страница создания тарифа
**Файл:** `nail-academy-pro/app/admin/courses/[courseId]/pricing/create/page.tsx`

**Функционал:**
- Форма создания нового тарифа
- Поля:
  - Название (обязательно)
  - Описание
  - Период доступа (dropdown)
  - Цена (обязательно)
  - Валюта (по умолчанию KZT)
  - Рекомендуемый (checkbox)
  - Активен (checkbox, по умолчанию true)
- Валидация полей
- Сохранение в localStorage

**Структура формы:**
```tsx
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { savePricingPlan } from '@/lib/pricing';
import { ACCESS_PERIOD_OPTIONS, createAccessPeriod } from '@/lib/pricing';
import type { AccessPeriodType, PricingPlan } from '@/types';

export default function CreatePricingPlanPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  
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
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }
    
    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = 'Укажите корректную цену';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      const newPlan: PricingPlan = {
        id: `plan-${Date.now()}`,
        courseId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        accessPeriod: createAccessPeriod(formData.accessPeriod),
        price: Number(formData.price),
        currency: formData.currency,
        isActive: formData.isActive,
        isRecommended: formData.isRecommended,
        order: 999, // Будет пересчитан
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      savePricingPlan(newPlan);
      router.push(`/admin/courses/${courseId}/pricing`);
    } catch (error) {
      console.error('Ошибка создания тарифа:', error);
      alert('Ошибка при создании тарифа');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render form
}
```

**Зависимости:** Этап 1, Этап 3.1  
**Время:** 2-3 часа  
**Критичность:** 🔴 Критично

---

#### 3.3 Страница редактирования тарифа
**Файл:** `nail-academy-pro/app/admin/courses/[courseId]/pricing/[planId]/edit/page.tsx`

**Функционал:**
- Форма редактирования существующего тарифа
- Загрузка данных тарифа
- Аналогичная форма как при создании
- Кнопка удаления тарифа

**Структура:**
```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getCoursePricingPlans, savePricingPlan, deletePricingPlan } from '@/lib/pricing';
import { ACCESS_PERIOD_OPTIONS } from '@/lib/pricing';
import type { PricingPlan } from '@/types';

export default function EditPricingPlanPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const planId = params.planId as string;
  
  const [plan, setPlan] = useState<PricingPlan | null>(null);
  const [formData, setFormData] = useState({ /* ... */ });
  
  useEffect(() => {
    const plans = getCoursePricingPlans(courseId);
    const foundPlan = plans.find(p => p.id === planId);
    if (foundPlan) {
      setPlan(foundPlan);
      setFormData({
        name: foundPlan.name,
        description: foundPlan.description || '',
        accessPeriod: foundPlan.accessPeriod.type,
        price: foundPlan.price.toString(),
        currency: foundPlan.currency,
        isActive: foundPlan.isActive,
        isRecommended: foundPlan.isRecommended
      });
    }
  }, [courseId, planId]);
  
  const handleDelete = () => {
    if (confirm('Удалить этот тарифный план?')) {
      deletePricingPlan(courseId, planId);
      router.push(`/admin/courses/${courseId}/pricing`);
    }
  };
  
  // Similar submit logic as create
}
```

**Зависимости:** Этап 3.2  
**Время:** 1-2 часа  
**Критичность:** 🟡 Средняя

---

### **Этап 4: Улучшения UX**

#### 4.1 Drag & Drop сортировка
**Библиотека:** `@dnd-kit/core` или `react-beautiful-dnd`

**Установка:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Реализация:**
В файле `pricing/page.tsx` добавить drag & drop для изменения порядка тарифов.

**Зависимости:** Этап 3.1  
**Время:** 2 часа  
**Критичность:** 🟢 Низкая (можно без этого)

---

#### 4.2 Валидация и предупреждения
**Действия:**
- Предупреждение при удалении активного тарифа
- Проверка минимум 1 активного тарифа
- Предупреждение при создании дубликатов названий

**Зависимости:** Этап 3  
**Время:** 1 час  
**Критичность:** 🟡 Средняя

---

#### 4.3 Мобильная адаптация
**Действия:**
- Адаптировать страницы для мобильных устройств
- Использовать `flex-col` на малых экранах
- Упрощенное отображение карточек тарифов

**Зависимости:** Этап 3  
**Время:** 1-2 часа  
**Критичность:** 🟡 Средняя

---

### **Этап 5: Тестирование**

#### 5.1 Функциональное тестирование
- ✅ Создание тарифа
- ✅ Редактирование тарифа
- ✅ Удаление тарифа
- ✅ Изменение порядка
- ✅ Включение/выключение активности
- ✅ Выбор тарифа при покупке
- ✅ Отображение тарифов на странице курса

**Зависимости:** Все предыдущие этапы  
**Время:** 2 часа  
**Критичность:** 🔴 Критично

---

#### 5.2 Тестирование синхронизации данных
- ✅ Создать тариф через админку
- ✅ Проверить отображение в модальном окне покупки
- ✅ Проверить сохранение в localStorage
- ✅ Перезагрузить страницу и проверить загрузку

**Зависимости:** Этап 1, Этап 3  
**Время:** 1 час  
**Критичность:** 🔴 Критично

---

## 📊 Общая оценка времени

| Этап | Время | Критичность |
|------|-------|-------------|
| Этап 1: Исправление данных | 1-2 часа | 🔴 Критично |
| Этап 2: Обновление страниц | 30 минут | 🟡 Средняя |
| Этап 3: Создание страниц | 5-8 часов | 🔴 Критично |
| Этап 4: Улучшения UX | 4-5 часов | 🟢 Низкая |
| Этап 5: Тестирование | 3 часа | 🔴 Критично |
| **ИТОГО** | **13-18 часов** | |

---

## 🚀 Порядок выполнения (по приоритету)

1. **Этап 1** (1-2 часа) - Исправление критичной проблемы с данными
2. **Этап 3.1** (2-3 часа) - Страница списка тарифов
3. **Этап 3.2** (2-3 часа) - Страница создания тарифа
4. **Этап 2.1** (30 минут) - Кнопка управления
5. **Этап 5.1, 5.2** (3 часа) - Тестирование базового функционала
6. **Этап 3.3** (1-2 часа) - Страница редактирования
7. **Этап 4** (4-5 часов) - Улучшения UX (опционально)

---

## 📝 Файлы для создания/изменения

### Создать:
1. `nail-academy-pro/app/admin/courses/[courseId]/pricing/page.tsx`
2. `nail-academy-pro/app/admin/courses/[courseId]/pricing/create/page.tsx`
3. `nail-academy-pro/app/admin/courses/[courseId]/pricing/[planId]/edit/page.tsx`

### Изменить:
1. `nail-academy-pro/lib/courseData.ts` - добавить `getCourseWithPricing()`
2. `nail-academy-pro/hooks/usePurchase.ts` - использовать `getCourseWithPricing()`
3. `nail-academy-pro/components/modals/PurchaseModal.tsx` - использовать `getCourseWithPricing()`
4. `nail-academy-pro/app/admin/courses/[courseId]/page.tsx` - добавить кнопку управления

---

## ✅ Критерии готовности

### MVP (минимально работающий продукт):
- ✅ Исправлена проблема с данными (Этап 1)
- ✅ Можно создать тариф
- ✅ Можно редактировать тариф
- ✅ Можно удалить тариф
- ✅ Тарифы отображаются при покупке
- ✅ Данные сохраняются и загружаются корректно

### Полная версия:
- ✅ MVP готов
- ✅ Drag & drop сортировка
- ✅ Мобильная адаптация
- ✅ Валидация и предупреждения
- ✅ Все тесты пройдены

---

## 🔍 Риски и ограничения

### Риски:
1. **localStorage** - данные локальные, не синхронизируются между устройствами
2. **SSR** - проблемы при серверном рендеринге Next.js
3. **Производительность** - при большом количестве тарифов

### Ограничения:
1. Нет бэкенда - все данные в localStorage
2. Нет аутентификации - любой может изменить
3. Нет истории изменений
4. Нет версионирования

### Будущие улучшения:
1. Перенос на реальный бэкенд (API)
2. Добавление аутентификации
3. История изменений тарифов
4. A/B тестирование тарифов
5. Аналитика по покупкам

---

## 📌 Примечания

- Все интерфейсы и типы уже готовы
- Функции для работы с localStorage готовы
- Базовая структура проекта хорошо организована
- Код должен быть адаптирован для мобильных устройств
- Следовать существующему стилю кода в проекте
