'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, CheckCircle2, Lock, Layers, Video, Play } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { isPurchaseActive } from '@/lib/storage';
import Header from '@/components/layout/Header';
import { getAllCourses, getAllLessons } from '@/lib/courseData';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const courses = getAllCourses();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Используем useMemo для разделения курсов БЕЗ вызова хуков в циклах
  const { purchasedCourses, freeCourses } = useMemo(() => {
    const purchased: any[] = [];
    const free: any[] = [];

    courses.forEach(course => {
      if (isPurchaseActive(course.id)) {
        purchased.push(course);
      } else {
        free.push(course);
      }
    });

    return { purchasedCourses: purchased, freeCourses: free };
  }, [courses]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen page-wrapper">
        <div className="container-custom max-w-6xl">
          {/* Page Title */}
          <div className="mb-6 md:mb-8 animate-fade-in">
            <h1 className="mb-2">Мои курсы</h1>
            <p className="text-lg md:text-xl text-dark-600">
              Управляйте своим обучением
            </p>
          </div>

          {/* Purchased Courses */}
          {purchasedCourses.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-dark-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                Купленные курсы ({purchasedCourses.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {purchasedCourses.map((course, index) => (
                  <CourseCard key={course.id} course={course} isPurchased={true} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Free Courses */}
          {freeCourses.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-dark-900 mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-gray-600" />
                Бесплатные курсы ({freeCourses.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {freeCourses.map((course, index) => (
                  <CourseCard key={course.id} course={course} isPurchased={false} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {courses.length === 0 && (
            <div className="card text-center py-16">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-dark-900 mb-2">Нет доступных курсов</h2>
              <p className="text-dark-600 mb-6">Курсы появятся здесь, когда они будут добавлены</p>
              <Link href="/courses" className="btn btn-primary">
                Посмотреть каталог
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

// Компонент карточки курса
interface CourseCardProps {
  course: any;
  isPurchased: boolean;
  index: number;
}

function CourseCard({ course, isPurchased, index }: CourseCardProps) {
  const { getProgressPercentage, getCompletedCount, getTotalCount, progress: progressIds, getLastLessonId } = useProgress(course.id);
  const progress = getProgressPercentage();
  const completed = getCompletedCount();
  const total = getTotalCount();
  
  const totalModules = course.modules.length;
  const totalLessons = course.modules.reduce(
    (sum: number, module: any) => sum + module.lessons.length,
    0
  );
  const freeLessonsCount = course.modules.reduce(
    (sum: number, module: any) => sum + module.lessons.filter((l: any) => l.isFree).length,
    0
  );

  // Определяем следующий урок
  const getNextLessonId = () => {
    const allLessons = getAllLessons(course.id);
    const lastLessonId = getLastLessonId();
    
    let nextLesson = allLessons.find(l => !progressIds.includes(l.id));
    
    // Если есть последний урок, берем следующий после него
    if (lastLessonId) {
      const lastIndex = allLessons.findIndex(l => l.id === lastLessonId);
      if (lastIndex >= 0 && lastIndex < allLessons.length - 1) {
        const potentialNext = allLessons[lastIndex + 1];
        if (!progressIds.includes(potentialNext.id)) {
          nextLesson = potentialNext;
        }
      }
    }
    
    if (!nextLesson) {
      nextLesson = allLessons[0];
    }
    
    return nextLesson ? nextLesson.id : null;
  };

  const nextLessonId = getNextLessonId();

  return (
    <div 
      className="card card-hover animate-slide-up group"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Course Image */}
      <div className="w-full h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center mb-4 group-hover:from-primary-200 group-hover:to-primary-300 transition-all">
        <BookOpen className="w-16 h-16 text-primary-600" />
      </div>

      {/* Course Info */}
      <h3 className="text-xl font-bold text-dark-900 mb-2 group-hover:text-primary-600 transition-colors">
        {course.title}
      </h3>
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

      {/* Progress */}
      {progress > 0 && (
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
          <p className="text-xs text-dark-500 mt-2">
            {completed} из {total} уроков завершено
          </p>
        </div>
      )}

      {/* Status Badge */}
      <div className="mb-4">
        {isPurchased ? (
          <span className="badge bg-green-100 text-green-700 flex items-center gap-2 w-full justify-center">
            <CheckCircle2 className="w-4 h-4" />
            Полный доступ
          </span>
        ) : (
          <span className="badge bg-gray-100 text-gray-600 flex items-center gap-2 w-full justify-center">
            <Lock className="w-4 h-4" />
            {freeLessonsCount} бесплатных {freeLessonsCount === 1 ? 'урок' : 'уроков'}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link
          href={`/course/${course.id}`}
          className="btn btn-secondary flex-1 text-sm"
        >
          Детали курса
        </Link>
        {isPurchased || progress > 0 ? (
          nextLessonId ? (
            <Link
              href={`/lesson/${nextLessonId}`}
              className="btn btn-primary flex-1 text-sm flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {progress > 0 ? 'Продолжить' : 'Начать'}
            </Link>
          ) : (
            <Link
              href={`/course/${course.id}`}
              className="btn btn-primary flex-1 text-sm flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Смотреть курс
            </Link>
          )
        ) : (
          <Link
            href={`/course/${course.id}`}
            className="btn btn-primary flex-1 text-sm"
          >
            Попробовать
          </Link>
        )}
      </div>
    </div>
  );
}
