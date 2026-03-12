# Анализ работы с тарифными планами в проекте

## 📊 Текущее состояние

### ✅ Что работает правильно:

#### 1. **Типы и интерфейсы** ([`types/index.ts`](nail-academy-pro/types/index.ts))
- Хорошо определен интерфейс `PricingPlan` (строки 37-54)
- Правильно используется тип `AccessPeriodType` 
- Интерфейс `Course` корректно содержит массив `pricingPlans`

#### 2. **Константы и утилиты** ([`lib/pricing.ts`](nail-academy-pro/lib/pricing.ts))
- Правильно определены периоды доступа (1month, 2months, 3months, 6months, 12months, unlimited)
- Есть готовые функции для работы с тарифами:
  - `getCoursePricingPlans(courseId)` - получить тарифы
  - `savePricingPlan(plan)` - сохранить тариф
  - `deletePricingPlan(courseId, planId)` - удалить тариф
  - `getActivePricingPlans(courseId)` - получить активные тарифы

#### 3. **Данные курса** ([`lib/courseData.ts`](nail-academy-pro/lib/courseData.ts))
- Курс содержит правильно структурированные тарифные планы (строки 8-63)
- Все поля соответствуют интерфейсу `PricingPlan`
- Есть примеры тарифов: 1 месяц (18,000 KZT), 2 месяца (27,000 KZT), Бессрочный (45,000 KZT)

#### 4. **Хук покупки** ([`hooks/usePurchase.ts`](nail-academy-pro/hooks/usePurchase.ts))
- Правильно работает с `courseData.pricingPlans` (строка 46)
- Корректно обрабатывает периоды доступа и даты истечения (строки 54-85)

#### 5. **Компонент покупки** ([`components/modals/PurchaseModal.tsx`](nail-academy-pro/components/modals/PurchaseModal.tsx))
- Правильно отображает тарифные планы из `courseData.pricingPlans` (строка 72)
- Работает с выбором плана и покупкой

---

## ⚠️ Обнаруженные несостыковки:

### 1. **КРИТИЧНО: Разрыв между `courseData` и `localStorage`**

**Проблема:**
- В [`lib/pricing.ts`](nail-academy-pro/lib/pricing.ts) функции работают с `localStorage` (строки 41-66)
- Но в [`lib/courseData.ts`](nail-academy-pro/lib/courseData.ts) тарифные планы жестко заданы в коде (строки 8-63)
- В [`components/modals/PurchaseModal.tsx`](nail-academy-pro/components/modals/PurchaseModal.tsx) используется `courseData.pricingPlans` (строка 72)
- В [`hooks/usePurchase.ts`](nail-academy-pro/hooks/usePurchase.ts) тоже используется `coursesData.find()` (строки 45, 55)

**Проблема:**
При создании/редактировании тарифов через админку они сохранятся в localStorage, но компоненты и хуки будут читать данные из жестко закодированного `courseData`, а не из localStorage.

**Решение:**
Необходимо синхронизировать данные:
```typescript
// В lib/courseData.ts добавить функцию:
export const getCourseWithPricing = (courseId: string) => {
  const course = coursesData.find(c => c.id === courseId);
  if (!course) return null;
  
  // Пытаемся загрузить тарифы из localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`nail_pricing_${courseId}`);
    if (stored) {
      return {
        ...course,
        pricingPlans: JSON.parse(stored)
      };
    }
  }
  
  return course;
};
```

### 2. **Нет страниц для редактирования тарифов**

**Текущее состояние:**
- Есть только примечание в [`app/admin/courses/[courseId]/edit/page.tsx`](nail-academy-pro/app/admin/courses/[courseId]/edit/page.tsx:185-189)
- Пустые каталоги: `[courseId]/pricing/` и `[courseId]/pricing/create/`

**Необходимо создать:**
- `/admin/courses/[courseId]/pricing` - список тарифов
- `/admin/courses/[courseId]/pricing/create` - создание тарифа  
- `/admin/courses/[courseId]/pricing/[planId]/edit` - редактирование тарифа

### 3. **Отсутствие кнопки управления тарифами**

**Проблема:**
В [`app/admin/courses/[courseId]/page.tsx`](nail-academy-pro/app/admin/courses/[courseId]/page.tsx:169-210) есть секция "Тарифные планы", но нет кнопки для перехода к управлению ими.

**Решение:**
Добавить кнопку "Управление тарифами" рядом с заголовком секции:
```tsx
<div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-bold text-gray-900">
    Тарифные планы ({course.pricingPlans?.length || 0})
  </h3>
  <Link
    href={`/admin/courses/${courseId}/pricing`}
    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white..."
  >
    <Plus className="w-4 h-4" />
    Управление тарифами
  </Link>
</div>
```

### 4. **Нет обработки порядка тарифов (order)**

**Проблема:**
В типе `PricingPlan` есть поле `order: number` (строка 51 в types/index.ts), но нигде не используется drag & drop или другой механизм для изменения порядка отображения тарифов.

**Решение:**
При реализации страницы списка тарифов добавить:
- Отображение с сортировкой по `order`
- Drag & drop для изменения порядка
- Кнопки вверх/вниз

### 5. **Отсутствие валидации при создании курса**

**Проблема:**
В [`app/admin/courses/create/page.tsx`](nail-academy-pro/app/admin/courses/create/page.tsx) нет добавления тарифных планов при создании курса.

**Решение:**
После создания курса перенаправлять на `/admin/courses/[courseId]/pricing` с подсказкой "Добавьте тарифные планы для курса".

---

## 🎯 Потенциальные проблемы:

### 1. **SSR vs CSR**
- `localStorage` работает только на клиенте
- Функции в `lib/pricing.ts` используют `localStorage` напрямую
- Могут возникнуть проблемы при SSR в Next.js

**Решение:**
Обернуть в проверку:
```typescript
if (typeof window !== 'undefined') {
  // работа с localStorage
}
```

### 2. **Синхронизация данных**
- Компоненты могут не обновляться при изменении тарифов
- Нужен механизм реактивности

**Решение:**
Использовать Context API или Zustand для управления состоянием тарифов.

### 3. **Валидация цен**
- Нет проверки на отрицательные цены
- Нет проверки на разумные значения

**Решение:**
Добавить валидацию в формы создания/редактирования тарифов.

---

## 📝 Выводы:

### Критичные несостыковки:
1. ✅ **Типы и интерфейсы** - все в порядке
2. ❌ **Разрыв между статическими данными и localStorage** - КРИТИЧНО
3. ❌ **Нет страниц редактирования** - блокирует функционал
4. ⚠️ **Отсутствие кнопок управления** - UX проблема

### Рекомендации:
1. **Первым делом** создать функцию синхронизации данных между `courseData` и `localStorage`
2. **Затем** реализовать страницы управления тарифами согласно Варианту 1
3. **Добавить** кнопку "Управление тарифами" на странице курса
4. **Протестировать** весь флоу создания/редактирования/удаления тарифов

### Готовность к реализации:
- 🟢 Инфраструктура: 80% (типы, утилиты готовы)
- 🔴 UI/UX: 20% (нет страниц редактирования)
- 🟡 Логика: 60% (есть функции, но нужна синхронизация)

**Общая готовность: ~50%**
