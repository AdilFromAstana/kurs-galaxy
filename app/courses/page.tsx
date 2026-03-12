'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, Lock, TrendingUp, Layers, Video, DollarSign, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { usePurchase } from '@/hooks/usePurchase';
import { getAllCourses } from '@/lib/courseData';
import Header from '@/components/layout/Header';
import PurchaseModal from '@/components/modals/PurchaseModal';

export default function CoursesPage() {
  const { isAuthenticated } = useAuth();
  const courses = getAllCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handlePurchaseClick = (courseId: string) => {
    if (!isAuthenticated) {
      // Redirect to register with course info
      window.location.href = `/auth/register?course=${courseId}`;
      return;
    }
    setSelectedCourseId(courseId);
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseModal(false);
    window.location.reload();
  };

  return (
    <>
      <Header />
      <main className="min-h-screen page-wrapper">
        <div className="container-custom max-w-7xl">
          {/* Page Title */}
          <div className="mb-6 md:mb-8 animate-fade-in">
            <h1 className="mb-2">Каталог курсов</h1>
            <p className="text-lg md:text-xl text-dark-600">
              Выберите курс для профессионального роста
            </p>
          </div>

          {/* Courses Grid */}
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
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
            <div className="card text-center py-16">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-dark-900 mb-2">Нет доступных курсов</h2>
              <p className="text-dark-600">Курсы появятся здесь, когда они будут добавлены</p>
            </div>
          )}
        </div>
      </main>

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

// Компонент карточки курса
interface CourseCardProps {
  course: any;
  index: number;
  isAuthenticated: boolean;
  onPurchaseClick: (courseId: string) => void;
}

function CourseCard({ course, index, isAuthenticated, onPurchaseClick }: CourseCardProps) {
  const { getProgressPercentage } = useProgress(course.id);
  const { isPurchased } = usePurchase(course.id);
  
  const progress = getProgressPercentage();
  const totalModules = course.modules.length;
  const totalLessons = course.modules.reduce(
    (sum: number, module: any) => sum + module.lessons.length,
    0
  );
  const freeLessonsCount = course.modules.reduce(
    (sum: number, module: any) => sum + module.lessons.filter((l: any) => l.isFree).length,
    0
  );

  // Вычисляем минимальную цену из тарифных планов
  const minPrice = course.pricingPlans && course.pricingPlans.length > 0
    ? Math.min(...course.pricingPlans.filter((p: any) => p.isActive).map((p: any) => p.price))
    : null;

  // Получаем валюту (предполагаем что все планы в одной валюте)
  const currency = course.pricingPlans && course.pricingPlans.length > 0
    ? course.pricingPlans[0].currency
    : '₸';

  // Количество активных тарифных планов
  const activePlansCount = course.pricingPlans
    ? course.pricingPlans.filter((p: any) => p.isActive).length
    : 0;

  return (
    <div 
      className="card card-hover animate-slide-up group flex flex-col"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Course Icon/Image */}
      <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center mb-5 group-hover:from-primary-200 group-hover:to-primary-300 transition-all">
        <BookOpen className="w-20 h-20 text-primary-600" />
      </div>

      {/* Course Info */}
      <Link href={`/course/${course.id}`} className="flex-1 flex flex-col">
        <h2 className="text-xl font-bold text-dark-900 mb-2 group-hover:text-primary-600 transition-colors">
          {course.title}
        </h2>
        <p className="text-sm text-dark-600 mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-dark-500">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>{totalModules} модулей</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Video className="w-4 h-4" />
            <span>{totalLessons} уроков</span>
          </div>
        </div>

        {/* Free Lessons Badge */}
        {freeLessonsCount > 0 && (
          <div className="mb-4">
            <span className="badge bg-green-50 text-green-700 flex items-center gap-2 w-fit">
              <Star className="w-3 h-3" />
              {freeLessonsCount} бесплатных {freeLessonsCount === 1 ? 'урок' : 'уроков'}
            </span>
          </div>
        )}

        {/* Progress (for authenticated users) */}
        {isAuthenticated && progress > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-600">Прогресс</span>
              <span className="text-sm font-semibold text-primary-600">
                {progress}%
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </Link>

      {/* Price Section */}
      {minPrice && !isPurchased && (
        <div className="mt-auto pt-4 border-t border-gray-200 mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-dark-600">От</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary-600">
                {minPrice.toLocaleString()}
              </span>
              <span className="text-sm text-dark-500">{currency}</span>
            </div>
          </div>
          {activePlansCount > 1 && (
            <span className="text-xs text-dark-500">
              {activePlansCount} {activePlansCount === 1 ? 'тариф' : activePlansCount < 5 ? 'тарифа' : 'тарифов'}
            </span>
          )}
        </div>
      )}

      {/* Status Badge & Action Button */}
      <div className="mt-auto flex flex-col gap-3">
        {isAuthenticated && isPurchased ? (
          <>
            <span className="badge bg-primary-100 text-primary-700 flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-4 h-4" />
              Полный доступ
            </span>
            <Link
              href={`/course/${course.id}`}
              className="btn btn-primary w-full text-center"
            >
              {progress > 0 ? 'Продолжить обучение' : 'Начать обучение'}
            </Link>
          </>
        ) : isAuthenticated && progress > 0 ? (
          <>
            <span className="badge bg-blue-100 text-blue-700 flex items-center gap-2 justify-center">
              <TrendingUp className="w-4 h-4" />
              В процессе
            </span>
            <button
              onClick={() => onPurchaseClick(course.id)}
              className="btn btn-primary w-full"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Купить полный доступ
            </button>
          </>
        ) : (
          <>
            {!isAuthenticated ? (
              <span className="badge bg-gray-100 text-gray-600 flex items-center gap-2 justify-center">
                <Lock className="w-4 h-4" />
                Требуется регистрация
              </span>
            ) : (
              <span className="badge bg-gray-100 text-gray-600 flex items-center gap-2 justify-center">
                <Lock className="w-4 h-4" />
                Доступны бесплатные уроки
              </span>
            )}
            <button
              onClick={() => onPurchaseClick(course.id)}
              className="btn btn-primary w-full"
            >
              {!isAuthenticated ? 'Начать обучение' : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Купить курс
                </>
              )}
            </button>
          </>
        )}
        
        {/* Details Link */}
        <Link
          href={`/course/${course.id}`}
          className="btn btn-secondary w-full text-center"
        >
          Подробнее о курсе
        </Link>
      </div>
    </div>
  );
}
