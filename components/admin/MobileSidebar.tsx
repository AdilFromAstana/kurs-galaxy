'use client';

import { X, LogOut, LayoutDashboard, BookOpen, Users, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/lib/auth/actions';
import type { AdminSession } from '@/types/admin';

interface Props {
  session: AdminSession;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/courses', icon: BookOpen, label: 'Курсы' },
  { href: '/admin/students', icon: Users, label: 'Студенты' },
  { href: '/admin/settings', icon: Settings, label: 'Настройки' },
];

export function MobileSidebar({ session, isOpen, onClose }: Props) {
  const pathname = usePathname();
  
  const handleLogout = async () => {
    onClose();
    await logoutAction();
  };
  
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-primary-600">
                Админ-панель
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">KursGalaxy.kz</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 active:bg-gray-100 rounded-lg touch-manipulation"
              aria-label="Закрыть меню"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all touch-manipulation ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 active:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Profile & Logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-700 font-semibold text-lg">
                  {session.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session.email}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 active:bg-red-50 rounded-lg transition-colors touch-manipulation"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Выйти</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
