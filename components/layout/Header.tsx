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
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Открыть меню"
            >
              <Menu className="w-6 h-6 text-dark-700" />
            </button>

            {/* Logo */}
            <Link 
              href={isAuthenticated ? '/dashboard' : '/'} 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="text-base md:text-lg font-bold text-dark-900">
                KursGalaxy.kz
              </span>
            </Link>

            {/* Right side spacer для центрирования логотипа */}
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* Боковое выдвижное меню */}
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
