'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, Users, Award, Globe, Settings } from 'lucide-react';

const NAV = [
  { name: 'Главная', href: '/admin', icon: LayoutDashboard },
  { name: 'Курсы', href: '/admin/courses', icon: BookOpen },
  { name: 'Студенты', href: '/admin/students', icon: Users },
  { name: 'Сертификат', href: '/admin/certificate', icon: Award },
  { name: 'Сайт', href: '/admin/site', icon: Globe },
  { name: 'Настройки', href: '/admin/settings', icon: Settings },
];

export function AdminDesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {NAV.map((item) => {
        const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
