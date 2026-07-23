'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Globe, Award } from 'lucide-react';

const TABS = [
  { name: 'Аккаунт', href: '/admin/settings', icon: User },
  { name: 'Сайт', href: '/admin/site', icon: Globe },
  { name: 'Сертификат', href: '/admin/certificate', icon: Award },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-gray-200 -mb-px overflow-x-auto">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              active
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
