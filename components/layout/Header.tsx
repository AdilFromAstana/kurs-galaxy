"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Award,
  ChevronDown,
  LogOut,
  User,
  Settings,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SideDrawer from "./SideDrawer";

export default function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();

  // Закрываем меню по клику снаружи и по Escape
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isUserMenuOpen]);

  const navLinks = isAuthenticated
    ? [
        { name: "Мои курсы", href: "/dashboard" },
        { name: "Каталог", href: "/courses" },
      ]
    : [
        { name: "Главная", href: "/" },
        { name: "Курсы", href: "/courses" },
      ];

  const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Левая часть: бургер (мобила) + лого */}
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Открыть меню"
              >
                <Menu className="w-6 h-6 text-dark-700" />
              </button>

              <Link
                href={isAuthenticated ? "/dashboard" : "/"}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <span className="text-base md:text-lg font-bold text-dark-900">
                  KursGalaxy.kz
                </span>
              </Link>
            </div>

            {/* Десктоп-навигация */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-100 text-primary-700"
                        : "text-dark-600 hover:bg-gray-100"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Правая часть */}
            <div className="hidden md:flex items-center gap-2">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-sm font-medium text-dark-600 hover:text-dark-900"
                  >
                    Войти
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Регистрация
                  </Link>
                </>
              ) : (
                /* Меню пользователя для десктопа */
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-haspopup="menu"
                    aria-expanded={isUserMenuOpen}
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {initial}
                    </div>
                    <span className="text-sm font-medium text-dark-900 max-w-[140px] truncate">
                      {user?.name}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-dark-500 transition-transform ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-scale-in z-50"
                      role="menu"
                    >
                      {/* User info */}
                      <div className="px-4 py-3 bg-gradient-to-br from-primary-50 to-primary-100 border-b border-gray-100">
                        <p className="text-sm font-semibold text-dark-900 truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-dark-600 truncate">
                          {user?.email}
                        </p>
                      </div>

                      {/* Links */}
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-700 hover:bg-gray-50 transition-colors"
                          role="menuitem"
                        >
                          <BookOpen className="w-4 h-4 text-dark-500" />
                          Мои курсы
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-700 hover:bg-gray-50 transition-colors"
                          role="menuitem"
                        >
                          <User className="w-4 h-4 text-dark-500" />
                          Профиль
                        </Link>
                        <Link
                          href="/profile/edit"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-700 hover:bg-gray-50 transition-colors"
                          role="menuitem"
                        >
                          <Settings className="w-4 h-4 text-dark-500" />
                          Редактировать
                        </Link>
                      </div>

                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          role="menuitem"
                        >
                          <LogOut className="w-4 h-4" />
                          Выйти
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Мобильный спейсер для центрирования логотипа */}
            <div className="md:hidden w-10" />
          </div>
        </div>
      </header>

      {/* Боковое выдвижное меню */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
