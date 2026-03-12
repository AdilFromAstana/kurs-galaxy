'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users,
  Settings 
} from 'lucide-react';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Главная' },
  { href: '/admin/courses', icon: BookOpen, label: 'Курсы' },
  { href: '/admin/students', icon: Users, label: 'Студенты' },
  { href: '/admin/settings', icon: Settings, label: 'Настройки' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  
  return (
    <>
      {/* Spacer для контента */}
      <div className="h-20 md:hidden" />
      
      {/* Bottom Navigation - только на мобилках */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors touch-manipulation min-w-[60px] ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-600 active:bg-gray-100'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-primary-600' : ''}`} />
                <span className={`text-xs ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
