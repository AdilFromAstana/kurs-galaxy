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

  // Закрываем drawer при нажатии Escape и блокируем скролл
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
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 max-w-[80vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation menu"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link 
              href={isAuthenticated ? '/dashboard' : '/'} 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity" 
              onClick={onClose}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-dark-900">KursGalaxy.kz</span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Закрыть меню"
            >
              <X className="w-5 h-5 text-dark-700" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4" aria-label="Основная навигация">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 font-semibold'
                        : 'text-dark-600 hover:bg-gray-100'
                    }`}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full" />
                    )}
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : ''}`} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            {isAuthenticated ? (
              <div>
                {/* User Info */}
                <div className="mb-4 px-2">
                  <p className="text-sm font-medium text-dark-900 truncate">{user?.name}</p>
                  <p className="text-xs text-dark-500 truncate">{user?.email}</p>
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
