# Изменения Header - Боковое выдвижное меню

## Обзор изменений

Переработан [`Header`](components/layout/Header.tsx:1) с полной заменой верхней навигации на современное **боковое выдвижное меню** (Side Drawer).

---

## Основные изменения

### 1. ❌ Убрано условие "только для авторизованных"

**Было:**
```typescript
if (!isAuthenticated) return null;
```

**Стало:**
```typescript
// Условие убрано - header показывается ВСЕМ пользователям
const { isAuthenticated } = useAuth();
```

**Результат:** ✅ Header теперь **универсальный** - виден всем пользователям

---

### 2. ✅ Новая структура: минимальный верхний header

**Было:** Полноценный header с навигацией и пользовательским меню
```jsx
<header className="sticky top-0">
  <Logo />
  <nav>
    <Link>Главная</Link>
    <Link>Курсы</Link>
    <Link>Профиль</Link>
  </nav>
  <UserMenu>
    <UserInfo />
    <LogoutButton />
  </UserMenu>
</header>
```

**Стало:** Минимальный header с кнопкой меню
```jsx
<header className="sticky top-0">
  <button onClick={openDrawer}>☰</button>
  <Logo />
  <div /> {/* spacer */}
</header>
```

**Результат:** ✅ Больше пространства для контента, современный UX

---

### 3. ✅ Создан новый компонент `SideDrawer`

**Файл:** [`components/layout/SideDrawer.tsx`](components/layout/SideDrawer.tsx:1)

**Структура:**
```
SideDrawer
├── Overlay (затемненный фон)
└── Drawer Panel (выдвижная панель)
    ├── Header (Logo + Close button)
    ├── Navigation (Список ссылок)
    └── Footer
        ├── User Info (если авторизован)
        └── Auth Buttons / Logout Button
```

**Анимация:**
- **Overlay:** `opacity: 0 → 1` (300ms)
- **Drawer:** `translateX(-100%) → 0` (300ms)

**Размеры:**
- **Desktop:** `width: 280px (20rem)`
- **Mobile:** `max-width: 80vw`

---

### 4. ✅ Разная навигация для разных пользователей

#### Для неавторизованных:
```typescript
const publicNav = [
  { name: 'Главная', href: '/', icon: Home },
  { name: 'Курсы', href: '/courses', icon: BookOpen },
];

// В футере drawer:
<Link href="/auth/login">Войти</Link>
<Link href="/auth/register">Регистрация</Link>
```

#### Для авторизованных:
```typescript
const authenticatedNav = [
  { name: 'Мои курсы', href: '/dashboard', icon: Home },
  { name: 'Каталог', href: '/courses', icon: BookOpen },
  { name: 'Профиль', href: '/profile', icon: User },
];

// В футере drawer:
<UserInfo name={user.name} email={user.email} />
<button onClick={logout}>Выйти</button>
```

**Результат:** ✅ Персонализированная навигация

---

### 5. ✅ Улучшенная доступность

**Добавлено:**
1. **Закрытие по Escape**
   ```typescript
   useEffect(() => {
     const handleEscape = (e: KeyboardEvent) => {
       if (e.key === 'Escape') onClose();
     };
     if (isOpen) {
       document.addEventListener('keydown', handleEscape);
     }
     return () => document.removeEventListener('keydown', handleEscape);
   }, [isOpen, onClose]);
   ```

2. **Блокировка скролла при открытом drawer**
   ```typescript
   if (isOpen) {
     document.body.style.overflow = 'hidden';
   }
   return () => {
     document.body.style.overflow = 'unset';
   };
   ```

3. **ARIA атрибуты**
   ```jsx
   <button aria-label="Открыть меню">
   <aside aria-label="Navigation menu">
   <nav aria-label="Основная навигация">
   <div aria-hidden="true"> {/* overlay */}
   ```

4. **Закрытие по клику на overlay**
   ```jsx
   <div onClick={onClose} />
   ```

**Результат:** ✅ Соответствие стандартам доступности (a11y)

---

### 6. ✅ Индикатор активной страницы

**Реализация:**
```jsx
{navigation.map((item) => {
  const isActive = pathname === item.href;
  return (
    <Link className={isActive ? 'active' : ''}>
      {/* Вертикальная полоска слева для активной ссылки */}
      {isActive && (
        <div className="absolute left-0 w-1 h-8 bg-primary-600 rounded-r-full" />
      )}
      <item.icon className={isActive ? 'text-primary-600' : ''} />
      <span>{item.name}</span>
    </Link>
  );
})}
```

**Результат:** ✅ Пользователь всегда знает, где он находится

---

## Новая структура компонентов

### Header.tsx (обновленный)
```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SideDrawer from './SideDrawer';

export default function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* Минимальный header */}
      <header>
        <button onClick={() => setIsDrawerOpen(true)}>☰</button>
        <Link href={isAuthenticated ? '/dashboard' : '/'}>
          <Logo />
          <span>Nail Academy Pro</span>
        </Link>
        <div /> {/* spacer */}
      </header>

      {/* Боковое меню */}
      <SideDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </>
  );
}
```

### SideDrawer.tsx (новый)
```typescript
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X, Home, BookOpen, User, LogIn, UserPlus, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();

  // Escape key handler + блокировка скролла
  useEffect(() => { /* ... */ }, [isOpen, onClose]);

  // Разная навигация
  const navigation = isAuthenticated ? authenticatedNav : publicNav;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className={`drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <Logo />
          <button onClick={onClose}>✕</button>
        </div>

        <nav className="drawer-nav">
          {navigation.map(item => (
            <Link key={item.name} href={item.href} onClick={onClose}>
              <item.icon />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="drawer-footer">
          {isAuthenticated ? (
            <>
              <UserInfo user={user} />
              <button onClick={logout}>Выйти</button>
            </>
          ) : (
            <>
              <Link href="/auth/login">Войти</Link>
              <Link href="/auth/register">Регистрация</Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
```

---

## Визуальное сравнение

### Было (верхний header):
```
┌─────────────────────────────────────────────┐
│ [Logo] Главная | Курсы | Профиль  [User] ▼ │
└─────────────────────────────────────────────┘
│                                              │
│              Page Content                    │
│                                              │
```

### Стало (боковое меню):
```
┌─────────────────────────────────────────────┐
│  [☰] Nail Academy Pro                       │
└─────────────────────────────────────────────┘
│                                              │
│              Page Content                    │
│  (больше места для контента)                │

При клике на [☰]:
┌─────────┐
│ ✕ Logo  │
│         │
│ 🏠 Мои   │
│ 📚 Катал │
│ 👤 Профи │
│         │
│ ─────── │
│ User    │
│ [Выйти] │
└─────────┘
```

---

## User Flow (Поведение пользователя)

### 1. Неавторизованный пользователь:
```
1. Видит header с логотипом и кнопкой меню [☰]
2. Кликает [☰]
3. → Открывается drawer
4. Видит:
   - 🏠 Главная (/)
   - 📚 Курсы (/courses)
   - [Войти] (/auth/login)
   - [Регистрация] (/auth/register)
5. Выбирает "Курсы"
6. → Drawer закрывается
7. → Переход на /courses
```

### 2. Авторизованный пользователь:
```
1. Видит header с логотипом и кнопкой меню [☰]
2. Кликает [☰]
3. → Открывается drawer
4. Видит:
   - 🏠 Мои курсы (/dashboard) ← активный
   - 📚 Каталог (/courses)
   - 👤 Профиль (/profile)
   - ────────
   - Имя: Иван
   - Email: ivan@mail.ru
   - [Выйти]
5. Выбирает "Каталог"
6. → Drawer закрывается
7. → Переход на /courses
```

### 3. Закрытие drawer:
```
Способы закрыть drawer:
- ✅ Клик на ✕ (кнопка закрытия)
- ✅ Клик на overlay (затемненный фон)
- ✅ Нажатие Escape
- ✅ Выбор пункта навигации (автозакрытие)
```

---

## Адаптивность

### Desktop (≥768px):
- Header: полноразмерный логотип с текстом
- Drawer width: `280px`
- Overlay: полупрозрачный черный
- Анимация: плавная (300ms)

### Tablet (≥640px, <768px):
- Header: средний логотип
- Drawer width: `280px`
- Overlay: полупрозрачный черный

### Mobile (<640px):
- Header: компактный логотип
- Drawer width: `max-w-[80vw]` (максимум 80% ширины экрана)
- Overlay: полупрозрачный черный
- Блокировка скролла при открытом drawer

---

## Преимущества новой структуры

### 1. Универсальность ✅
- Работает для авторизованных и неавторизованных
- Единый интерфейс для всех страниц
- Консистентный UX

### 2. Экономия пространства ✅
- Верхний header минимален (только лого + кнопка)
- Больше места для основного контента
- Меньше визуального шума

### 3. Современный UX ✅
- Соответствует трендам (как в мобильных приложениях)
- Привычный паттерн для пользователей
- Плавные анимации

### 4. Мобильная оптимизация ✅
- Оптимизировано для сенсорных экранов
- Большие touch-targets
- Блокировка случайных скроллов

### 5. Гибкость ✅
- Легко добавлять новые пункты меню
- Можно расширить функционал футера
- Модульная архитектура

### 6. Доступность (a11y) ✅
- Поддержка клавиатуры (Escape)
- ARIA атрибуты
- Семантическая разметка
- Управление фокусом

---

## Технические детали

### Анимации (Tailwind CSS):
```jsx
// Overlay
className={`transition-opacity duration-300 ${
  isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
}`}

// Drawer
className={`transform transition-transform duration-300 ${
  isOpen ? 'translate-x-0' : '-translate-x-full'
}`}
```

### Z-index hierarchy:
- **Header:** `z-40`
- **Drawer & Overlay:** `z-50`

### Управление состоянием:
```typescript
// В Header.tsx
const [isDrawerOpen, setIsDrawerOpen] = useState(false);

// Передача в SideDrawer
<SideDrawer 
  isOpen={isDrawerOpen} 
  onClose={() => setIsDrawerOpen(false)} 
/>
```

---

## Что можно улучшить в будущем (опционально)

### 1. Swipe gesture для закрытия
```typescript
const handleTouchStart = (e: TouchEvent) => {
  setTouchStart(e.touches[0].clientX);
};

const handleTouchEnd = (e: TouchEvent) => {
  const touchEnd = e.changedTouches[0].clientX;
  if (touchStart - touchEnd > 50) onClose(); // Swipe left
};
```

### 2. Счетчик уведомлений
```jsx
<Link href="/dashboard">
  Мои курсы
  {activeCourses > 0 && (
    <span className="ml-auto badge badge-sm bg-primary-500 text-white">
      {activeCourses}
    </span>
  )}
</Link>
```

### 3. Подсветка новых курсов
```jsx
<Link href="/courses">
  Каталог
  {hasNewCourses && (
    <span className="ml-auto w-2 h-2 bg-red-500 rounded-full" />
  )}
</Link>
```

### 4. Темная тема
```jsx
<button onClick={toggleTheme}>
  {theme === 'dark' ? <Sun /> : <Moon />}
  Тема: {theme === 'dark' ? 'Светлая' : 'Темная'}
</button>
```

### 5. Настройки в drawer
```jsx
<nav>
  {/* Основная навигация */}
</nav>
<div className="border-t">
  <Link href="/settings">⚙️ Настройки</Link>
  <Link href="/help">❓ Помощь</Link>
</div>
```

---

## Файлы

### Созданные:
- ✅ [`components/layout/SideDrawer.tsx`](components/layout/SideDrawer.tsx:1) - Новый компонент бокового меню

### Изменённые:
- ✅ [`components/layout/Header.tsx`](components/layout/Header.tsx:1) - Переработан в минимальный header

### Затронутые страницы (автоматически):
Все страницы, использующие `<Header />`:
- [`app/dashboard/page.tsx`](app/dashboard/page.tsx:1)
- [`app/courses/page.tsx`](app/courses/page.tsx:1)
- [`app/course/[courseId]/page.tsx`](app/course/[courseId]/page.tsx:1)
- [`app/profile/page.tsx`](app/profile/page.tsx:1)
- [`app/lesson/[lessonId]/page.tsx`](app/lesson/[lessonId]/page.tsx:1)

---

## Итоговые изменения

### ✅ Что изменилось:
1. **Header показывается всем** (убрано `if (!isAuthenticated)`)
2. **Минимальный верхний header** (только лого + кнопка меню)
3. **Новое боковое выдвижное меню** (SideDrawer компонент)
4. **Разная навигация** для авторизованных/неавторизованных
5. **Улучшенная доступность** (Escape, ARIA, блокировка скролла)
6. **Современные анимации** (overlay + drawer slide-in)

### ✅ Что стало лучше:
1. Больше пространства для контента
2. Универсальный header для всех пользователей
3. Современный и привычный UX
4. Мобильная оптимизация
5. Гибкость и расширяемость
6. Соответствие стандартам доступности

---

## Резюме

Реализован современный боковой drawer navigation вместо классического верхнего меню.
Теперь header **универсален** и работает для всех пользователей, а навигация **персонализирована** в зависимости от статуса авторизации. 

Боковое меню освобождает пространство для контента и соответствует современным UX трендам! 🎉
