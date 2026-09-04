'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Play,
  Layers,
  Video,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { usePurchase } from '@/hooks/usePurchase';
import { useCourses } from '@/components/providers/CoursesProvider';
import Header from '@/components/layout/Header';
import SiteFooter from '@/components/layout/SiteFooter';
import PurchaseModal from '@/components/modals/PurchaseModal';

function pluralModule(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'разделов';
  if (mod10 === 1) return 'раздел';
  if (mod10 >= 2 && mod10 <= 4) return 'раздела';
  return 'разделов';
}

function pluralLesson(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'уроков';
  if (mod10 === 1) return 'урок';
  if (mod10 >= 2 && mod10 <= 4) return 'урока';
  return 'уроков';
}

export default function CoursesPage() {
  const { isAuthenticated } = useAuth();
  const { courses } = useCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Только курсы с реальным контентом (фильтрует тестовый мусор без разделов)
  const visibleCourses = courses.filter((c) => c.modules.length > 0);

  const totalLessons = visibleCourses.reduce(
    (sum, c) =>
      sum + c.modules.reduce((s, m) => s + m.lessons.length, 0),
    0,
  );

  const handlePurchaseClick = (courseId: string) => {
    if (!isAuthenticated) {
      window.location.href = `/auth/register?course=${courseId}`;
      return;
    }
    setSelectedCourseId(courseId);
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseModal(false);
    // Состояние покупки обновится автоматически через session.refresh внутри модалки
  };

  return (
    <>
      <Header />
      <main className="min-h-screen page-wrapper">
        <div className="container-custom max-w-7xl">
          {/* Page Hero */}
          <div className="mb-8 md:mb-10 lg:mb-14 animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 lg:gap-8">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-dark-900 mb-3 md:mb-4">
                  Каталог курсов
                </h1>
                <p className="text-base md:text-lg lg:text-xl text-dark-600 max-w-2xl">
                  Выберите курс для профессионального роста в beauty-индустрии
                </p>
              </div>

              {visibleCourses.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm md:text-base">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-soft border border-gray-100">
                    <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-primary-600" />
                    <span className="font-semibold text-dark-900">
                      {visibleCourses.length}
                    </span>
                    <span className="text-dark-500">курсов</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-soft border border-gray-100">
                    <Video className="w-4 h-4 md:w-5 md:h-5 text-primary-600" />
                    <span className="font-semibold text-dark-900">
                      {totalLessons}
                    </span>
                    <span className="text-dark-500">уроков</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Courses Grid */}
          {visibleCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 lg:gap-7">
              {visibleCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  index={index}
                  isAuthenticated={isAuthenticated}
                  onPurchaseClick={handlePurchaseClick}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 md:p-16 text-center border-2 border-dashed border-gray-200">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-dark-900 mb-2">
                Курсов пока нет
              </h2>
              <p className="text-dark-600">
                Скоро здесь появятся новые курсы
              </p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />

      {/* Purchase Modal */}
      {selectedCourseId && (
        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={handlePurchaseSuccess}
          courseId={selectedCourseId}
        />
      )}
    </>
  );
}

interface CourseCardProps {
  course: any;
  index: number;
  isAuthenticated: boolean;
  onPurchaseClick: (courseId: string) => void;
}

function CourseCard({
  course,
  index,
  isAuthenticated,
  onPurchaseClick,
}: CourseCardProps) {
  const { getProgressPercentage } = useProgress(course.id);
  const { isPurchased } = usePurchase(course.id);

  const progress = getProgressPercentage();
  const totalModules = course.modules.length;
  const totalLessons = course.modules.reduce(
    (sum: number, module: any) => sum + module.lessons.length,
    0,
  );
  const freeLessonsCount = course.modules.reduce(
    (sum: number, module: any) =>
      sum + module.lessons.filter((l: any) => l.isFree).length,
    0,
  );

  const activePlans = (course.pricingPlans ?? []).filter((p: any) => p.isActive);
  const minPrice =
    activePlans.length > 0
      ? Math.min(...activePlans.map((p: any) => p.price))
      : null;
  const currency = activePlans[0]?.currency ?? '₸';

  // Инициал курса для обложки
  const initial = (course.title || '?').trim().charAt(0).toUpperCase();

  // CTA logic — одна кнопка
  const hasProgress = isAuthenticated && progress > 0;
  const ctaLabel = isPurchased
    ? hasProgress
      ? 'Продолжить'
      : 'Начать курс'
    : !isAuthenticated
      ? 'Купить'
      : hasProgress
        ? 'Купить полный доступ'
        : 'Купить';

  const ctaIsLink = isPurchased;
  const ctaHref = isPurchased ? `/course/${course.id}` : '#';

  const handleCtaClick = (e: React.MouseEvent) => {
    if (isPurchased) return; // Link сам обработает
    e.preventDefault();
    e.stopPropagation();
    onPurchaseClick(course.id);
  };

  // Бейдж статуса в углу обложки
  let statusBadge: React.ReactNode = null;
  if (isPurchased) {
    statusBadge = (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Доступ
      </div>
    );
  } else if (hasProgress) {
    statusBadge = (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-bold border border-primary-100">
        <TrendingUp className="w-3.5 h-3.5" />В процессе
      </div>
    );
  } else if (freeLessonsCount > 0) {
    statusBadge = (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
        <Star className="w-3.5 h-3.5 fill-emerald-700" />
        Бесплатные уроки
      </div>
    );
  } else if (!isAuthenticated) {
    statusBadge = (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-dark-700 rounded-full text-xs font-bold">
        <Lock className="w-3.5 h-3.5" />
        Доступ после покупки
      </div>
    );
  }

  return (
    <article
      className="group bg-white rounded-2xl shadow-soft border border-gray-100 hover:border-primary-200 transition-all overflow-hidden flex flex-col h-full animate-slide-up"
      style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
    >
      {/* Обложка */}
      <Link href={`/course/${course.id}`} className="block">
        <div className="relative h-44 md:h-48 bg-primary-50 overflow-hidden">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            /* Большой инициал — запасной вариант, пока у курса нет своего лого */
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl md:text-8xl font-black text-primary-200 group-hover:scale-110 transition-transform duration-300">
                {initial}
              </span>
            </div>
          )}

          {/* Status badge */}
          {statusBadge && (
            <div className="absolute top-3 left-3">{statusBadge}</div>
          )}

          {/* Прогресс-полоска снизу обложки */}
          {hasProgress && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary-100">
              <div
                className="h-full bg-primary-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </Link>

      {/* Контент карточки */}
      <div className="flex-1 flex flex-col p-5">
        {/* Title + description (кликабельны) */}
        <Link href={`/course/${course.id}`} className="block flex-1">
          <h3 className="text-lg lg:text-xl font-bold text-dark-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-dark-600 mb-4 line-clamp-3">
            {course.description}
          </p>
        </Link>

        {/* Stats — одной строкой с разделителем */}
        <div className="flex items-center gap-2 text-xs md:text-sm text-dark-500 mb-4">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>
              {totalModules} {pluralModule(totalModules)}
            </span>
          </div>
          <span className="text-dark-300">·</span>
          <div className="flex items-center gap-1.5">
            <Video className="w-4 h-4" />
            <span>
              {totalLessons} {pluralLesson(totalLessons)}
            </span>
          </div>
        </div>

        {/* Прогресс — текстом, тонко */}
        {hasProgress && !isPurchased && (
          <div className="mb-4 text-xs text-primary-700 font-semibold">
            Пройдено {progress}% — продолжите обучение
          </div>
        )}

        {/* Footer: цена + CTA */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {isPurchased ? (
            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Полный доступ</span>
            </div>
          ) : minPrice !== null ? (
            <div className="flex flex-col">
              <span className="text-[11px] text-dark-500 uppercase tracking-wide font-medium">
                От
              </span>
              <span className="text-xl lg:text-2xl font-bold text-dark-900 leading-tight">
                {minPrice.toLocaleString()}
                <span className="text-sm font-medium text-dark-500 ml-1">
                  {currency}
                </span>
              </span>
            </div>
          ) : (
            <span className="text-sm text-dark-500">Цена не указана</span>
          )}

          {ctaIsLink ? (
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              <Play className="w-4 h-4" />
              {ctaLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleCtaClick}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
