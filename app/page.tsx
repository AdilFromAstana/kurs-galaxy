'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, CheckCircle2, Star, Users, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getAllCourses } from '@/lib/courseData';

export default function WelcomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const courses = getAllCourses();
  const totalCourses = courses.length;
  const totalLessons = courses.reduce(
    (sum, course) => sum + course.modules.reduce(
      (mSum, module) => mSum + module.lessons.length, 0
    ), 0
  );

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen page-wrapper flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        {/* Logo */}
        <div className="mb-6 md:mb-8">
          <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-primary-500/30">
            <Award className="w-12 h-12 md:w-16 md:h-16 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-4 md:mb-6 bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
          KursGalaxy.kz
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl lg:text-2xl text-dark-600 mb-8 md:mb-12 max-w-2xl">
          Профессиональное онлайн-обучение
          <br className="hidden md:block" />
          <span className="text-primary-600 font-semibold">для специалистов beauty-индустрии</span>
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12 w-full max-w-4xl">
          <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex flex-col items-center">
              <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-primary-500 mb-3" />
              <h3 className="text-base md:text-lg font-semibold mb-2">
                {totalCourses} {totalCourses === 1 ? 'Курс' : 'Курса'}
              </h3>
              <p className="text-sm md:text-base text-dark-600">
                Профессиональные программы обучения
              </p>
            </div>
          </div>

          <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex flex-col items-center">
              <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-primary-500 mb-3" />
              <h3 className="text-base md:text-lg font-semibold mb-2">{totalLessons}+ Уроков</h3>
              <p className="text-sm md:text-base text-dark-600">
                Пошаговые видео-инструкции
              </p>
            </div>
          </div>

          <div className="card animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex flex-col items-center">
              <Star className="w-8 h-8 md:w-10 md:h-10 text-primary-500 mb-3" />
              <h3 className="text-base md:text-lg font-semibold mb-2">Сертификат</h3>
              <p className="text-sm md:text-base text-dark-600">
                После завершения каждого курса
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link
            href="/auth/register"
            className="btn btn-primary flex-1 animate-scale-in"
          >
            Начать обучение
          </Link>
          <Link
            href="/auth/login"
            className="btn btn-secondary flex-1 animate-scale-in"
            style={{ animationDelay: '0.1s' }}
          >
            Войти
          </Link>
        </div>

        {/* Social Proof */}
        <div className="mt-8 md:mt-12 text-dark-500 text-sm md:text-base">
          <p className="flex items-center justify-center gap-2">
            <span className="text-2xl">✨</span>
            Более 1000 успешных выпускниц
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-sm md:text-base text-dark-400">
        <p>© 2024 KursGalaxy.kz. Все права защищены.</p>
      </footer>
    </div>
  );
}
