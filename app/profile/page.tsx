"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Award,
  TrendingUp,
  Download,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { usePurchase } from "@/hooks/usePurchase";
import {
  useCourses,
  type CourseDTO,
} from "@/components/providers/CoursesProvider";
import Header from "@/components/layout/Header";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { courses } = useCourses();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || !isAuthenticated || !user) {
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
          <div className="mb-6 md:mb-8 animate-fade-in flex items-start justify-between gap-4">
            <div>
              <h1 className="mb-2">Профиль</h1>
              <p className="text-lg md:text-xl text-dark-600">
                Ваши достижения и прогресс
              </p>
            </div>
            <Link href="/profile/edit" className="btn btn-secondary text-sm">
              Редактировать
            </Link>
          </div>

          {/* User Info Card */}
          <div className="card card-hover mb-6 animate-slide-up">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold text-dark-900 mb-1">
                  {user.name}
                </h2>
                <p className="text-sm md:text-base text-dark-600 mb-2">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Course Cards */}
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-dark-900 mb-4">
              Мои курсы
            </h2>
          </div>

          {courses.length === 0 ? (
            <div className="card text-center text-dark-600">
              Курсы пока не доступны.
            </div>
          ) : (
            <div className="space-y-6">
              {courses.map((course, index) => (
                <CourseProfileCard
                  key={course.id}
                  course={course}
                  userName={user.name}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

interface CourseProfileCardProps {
  course: CourseDTO;
  userName: string;
  index: number;
}

function CourseProfileCard({ course, userName, index }: CourseProfileCardProps) {
  const {
    getProgressPercentage,
    getCompletedCount,
    getTotalCount,
    isFullyCompleted,
  } = useProgress(course.id);
  const { isPurchased } = usePurchase(course.id);

  const percentage = getProgressPercentage();
  const completed = getCompletedCount();
  const total = getTotalCount();
  const canDownloadCertificate = isFullyCompleted();

  const handleDownloadCertificate = () => {
    // Открываем эндпоинт в новой вкладке — браузер сам инициирует скачивание
    // (Content-Disposition: attachment) и юзер не уйдёт со страницы.
    window.open(`/api/courses/${course.id}/certificate`, '_blank');
  };

  return (
    <div
      className="card animate-slide-up"
      style={{ animationDelay: `${0.05 * index}s` }}
    >
      {/* Course Header */}
      <div className="flex items-start justify-between gap-4 mb-4 md:mb-6">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg md:text-xl font-bold text-dark-900 mb-1 truncate">
            {course.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {isPurchased ? (
              <span className="badge bg-primary-100 text-primary-700">
                ✨ Полный доступ
              </span>
            ) : (
              <span className="badge bg-gray-100 text-gray-600">
                Бесплатный доступ
              </span>
            )}
            {canDownloadCertificate && (
              <span className="badge bg-yellow-100 text-yellow-700">
                🏆 Курс завершён
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/course/${course.id}`}
          className="btn btn-secondary text-sm whitespace-nowrap"
        >
          Открыть
        </Link>
      </div>

      {/* Statistics Grid */}
      <div
        className={`grid grid-cols-1 gap-3 md:gap-4 mb-4 md:mb-6 ${
          canDownloadCertificate ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        <div className="p-4 rounded-xl bg-primary-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-dark-600 mb-1">Прогресс</p>
              <p className="text-xl md:text-2xl font-bold text-dark-900">
                {percentage}%
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-green-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-dark-600 mb-1">Завершено</p>
              <p className="text-xl md:text-2xl font-bold text-dark-900">
                {completed}/{total}
              </p>
            </div>
          </div>
        </div>

        {canDownloadCertificate && (
          <div className="p-4 rounded-xl bg-yellow-50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-dark-600 mb-1">Сертификат</p>
                <p className="text-base md:text-lg font-bold text-dark-900">
                  Доступен
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Certificate Section — только при 100% завершении */}
      {canDownloadCertificate && (
        <div className="rounded-2xl p-4 md:p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center bg-yellow-500 shadow-lg shadow-yellow-500/30">
                <Award className="w-10 h-10 md:w-12 md:h-12 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h4 className="text-lg md:text-xl font-bold text-dark-900 mb-2">
                Сертификат готов! 🎉
              </h4>
              <p className="text-sm text-dark-600 mb-4">
                Вы успешно завершили курс &quot;{course.title}&quot;. Скачайте
                именной сертификат.
              </p>
              <button
                onClick={handleDownloadCertificate}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Скачать сертификат PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
