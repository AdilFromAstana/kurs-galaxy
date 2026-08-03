"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import type { AdminSession } from "@/types/admin";
import { MobileSidebar } from "./MobileSidebar";

interface Props {
  session: AdminSession;
}

export function MobileHeader({ session }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {/* Header - всегда виден сверху */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-40 md:hidden safe-area-inset-top">
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

          {/* Спейсер под ширину кнопки-меню, чтобы логотип оставался по центру */}
          <div className="w-6" aria-hidden="true"></div>
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
