# План переработки Header

## Текущие проблемы

### 1. Header показывается только авторизованным ❌
```typescript
if (!isAuthenticated) return null;
```
**Проблема:** Теперь `/courses` публичная → нужен header для неавторизованных

### 2. Header находится сверху ❌
```jsx
<header className="sticky top-0 z-40">
  {/* Контент сверху */}
</header>
```
**Требование:** Сделать выдвижным (side drawer)

### 3. Навигация не учитывает публичные страницы ❌
```javascript
const navigation = [
  { name: 'Главная', href: '/dashboard', icon: Home },  // ❌ для неавторизованных нужна /
  { name: 'Курсы', href: '/courses', icon: BookOpen },  // ✅ подходит всем
  { name: 'Профиль', href: '/profile', icon: User },     // ❌ только для авторизованных
];
```

---

## Новая концепция

### Тип 1: Верхний минимальный header (для всех)
**Функции:**
- Логотип
- Кнопка открытия бокового меню (гамбургер)
- На мобильных: всегда виден

**Позиция:** Sticky top

### Тип 2: Боковое выдвижное меню (Sidebar Drawer)
**Функции:**
- Полная навигация
- Информация о пользователе
- Выход (для авторизованных)
- Вход/Регистрация (для неавторизованных)

**Позиция:** Fixed left, выдвигается по клику

---

## Структура нового Header

```
┌─────────────────────────────────────┐
│  [☰] Nail Academy Pro        [User] │ ← Минимальный верхний header
└─────────────────────────────────────┘
       │
       ▼ (клик на ☰)
┌─────────────┐                        
│             │ ← Выдвижное боковое меню
│   [X]       │
│             │
│ 🏠 Главная  │
│ 📚 Курсы    │
│ 👤 Профиль  │
│             │
│ ─────────── │
│ User Info   │
│ [Выйти]     │
│             │
└─────────────┘
```

---

## Навигация для разных пользователей

### Для неавторизованных:
```typescript
[
  { name: 'Главная', href: '/', icon: Home },
  { name: 'Курсы', href: '/courses', icon: BookOpen },
  // В футере меню:
  { name: 'Войти', href: '/auth/login', type: 'link' },
  { name: 'Регистрация', href: '/auth/register', type: 'button' },
]
```

### Для авторизованных:
```typescript
[
  { name: 'Мои курсы', href: '/dashboard', icon: Home },
  { name: 'Каталог', href: '/courses', icon: BookOpen },
  { name: 'Профиль', href: '/profile', icon: User },
  // В футере меню:
  { name: user.name, type: 'info' },
  { name: 'Выйти', type: 'button', onClick: logout },
]
```

---

## Технические детали

### Компоненты:

1. **`Header.tsx`** - Минимальный верхний header с кнопкой меню
2. **`SideDrawer.tsx`** (новый) - Выдвижное боковое меню с навигацией

### Состояние:
```typescript
const [isDrawerOpen, setIsDrawerOpen] = useState(false);
```

### Анимация открытия/закрытия:
```css
/* Overlay */
.drawer-overlay {
  opacity: 0;
  transition: opacity 300ms;
}
.drawer-overlay.open {
  opacity: 1;
}

/* Drawer */
.drawer {
  transform: translateX(-100%);
  transition: transform 300ms;
}
.drawer.open {
  transform: translateX(0);
}
```

### Размеры:
- **Desktop:** Drawer width 280px
- **Mobile:** Drawer width 75% viewport или max 320px

---

## Структура файлов

```
components/layout/
├── Header.tsx              ← Минимальный верхний header
├── SideDrawer.tsx          ← Новое: выдвижное меню (NEW)
└── NavigationItems.tsx     ← Новое: переиспользуемые элементы навигации (опционально)
```

---

## Реализация

### 1. Новый `Header.tsx` (минимальный)

```tsx
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
      {/* Минимальный верхний header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-dark-700" />
            </button>

            {/* Logo */}
            <Link href={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-dark-900">Nail Academy Pro</span>
            </Link>

            {/* Right side actions (опционально) */}
            <div className="w-10" /> {/* Spacer для центрирования */}
          </div>
        </div>
      </header>

      {/* Боковое выдвижное меню */}
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
```

### 2. Новый `SideDrawer.tsx`

```tsx
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

  // Закрываем drawer при нажатии Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Блокируем скролл
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Навигация для авторизованных
  const authenticatedNav = [
    { name: 'Мои курсы', href: '/dashboard', icon: Home },
    { name: 'Каталог', href: '/courses', icon: BookOpen },
    { name: 'Профиль', href: '/profile', icon: User },
  ];

  // Навигация для неавторизованных
  const publicNav = [
    { name: 'Главная', href: '/', icon: Home },
    { name: 'Курсы', href: '/courses', icon: BookOpen },
  ];

  const navigation = isAuthenticated ? authenticatedNav : publicNav;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 max-w-[80vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link href={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2" onClick={onClose}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-dark-900">Nail Academy</span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-dark-700" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-dark-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            {isAuthenticated ? (
              <div>
                {/* User Info */}
                <div className="mb-4 px-2">
                  <p className="text-sm font-medium text-dark-900">{user?.name}</p>
                  <p className="text-xs text-dark-500">{user?.email}</p>
                </div>
                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full btn btn-secondary"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/auth/login"
                  onClick={onClose}
                  className="w-full btn btn-secondary flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Войти
                </Link>
                <Link
                  href="/auth/register"
                  onClick={onClose}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
```

---

## Адаптивность

### Desktop (≥768px):
- Header: полноразмерный с логотипом
- Drawer: width 280px
- Overlay: затемнение фона

### Mobile (<768px):
- Header: компактный с логотипом
- Drawer: width 75vw (max 320px)
- Overlay: затемнение фона
- Блокировка скролла при открытом drawer

---

## Преимущества нового подхода

1. ✅ **Универсальность:** Работает для авторизованных и неавторизованных
2. ✅ **Больше пространства:** Верхний header минимален
3. ✅ **Современный UX:** Боковое меню как в популярных приложениях
4. ✅ **Мобильно-ориентированный:** Оптимизировано для touch-устройств
5. ✅ **Гибкость:** Легко добавлять новые элементы навигации
6. ✅ **Доступность:** Закрытие по Escape, блокировка скролла

---

## Дополнительные улучшения (опционально)

### 1. Добавить активную иконку в drawer
```tsx
{isActive && (
  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full" />
)}
```

### 2. Swipe для закрытия на мобильных
```typescript
const [touchStart, setTouchStart] = useState(0);
const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
const handleTouchEnd = (e) => {
  const touchEnd = e.changedTouches[0].clientX;
  if (touchStart - touchEnd > 50) onClose(); // Swipe left to close
};
```

### 3. Показывать количество активных курсов
```tsx
<Link href="/dashboard">
  Мои курсы
  {activeCourses > 0 && (
    <span className="ml-auto badge badge-sm">{activeCourses}</span>
  )}
</Link>
```

---

## Итоговая структура

```
Header (sticky top)
  ├── [☰] Hamburger button
  ├── Logo
  └── Spacer

SideDrawer (fixed left, slide-in)
  ├── Overlay (backdrop)
  └── Drawer panel
      ├── Header (Logo + Close button)
      ├── Navigation (Main links)
      └── Footer
          ├── User info (if authenticated)
          └── Auth buttons OR Logout button
```

---

## Резюме изменений

1. ✅ Убрать условие `if (!isAuthenticated) return null;` из Header
2. ✅ Создать минимальный верхний header с кнопкой меню
3. ✅ Создать новый компонент `SideDrawer.tsx`
4. ✅ Реализовать разную навигацию для авторизованных/неавторизованных
5. ✅ Добавить overlay и анимации
6. ✅ Сделать drawer responsive
7. ✅ Добавить доступность (Escape, блокировка скролла)
