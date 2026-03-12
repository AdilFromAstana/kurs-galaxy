'use client';

import { Menu, Bell, User } from 'lucide-react';
import { useState } from 'react';
import type { AdminSession } from '@/types/admin';
import { MobileSidebar } from './MobileSidebar';

interface Props {
  session: AdminSession;
}

export function MobileHeader({ session }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  return (
    <>
      {/* Header - всегда виден сверху */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40 md:hidden safe-area-inset-top">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-lg touch-manipulation"
            aria-label="Открыть меню"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          {/* Logo */}
          <div className="text-lg font-bold text-primary-600">
            KursGalaxy.kz
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center gap-1">
            <button 
              className="p-2 text-gray-600 active:bg-gray-100 rounded-lg relative touch-manipulation"
              aria-label="Уведомления"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            <button 
              className="p-2 text-gray-600 active:bg-gray-100 rounded-lg touch-manipulation"
              aria-label="Профиль"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile Sidebar Drawer */}
      <MobileSidebar
        session={session}
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
    </>
  );
}
