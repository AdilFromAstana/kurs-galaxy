"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Video,
  Clock,
  Lock,
  CheckCircle2,
  Play,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { usePurchase } from "@/hooks/usePurchase";
import { useCourses } from "@/components/providers/CoursesProvider";
import Header from "@/components/layout/Header";
import PurchaseModal from "@/components/modals/PurchaseModal";

const ACCESS_LABEL: Record<string, string> = {
  ONE_MONTH: "1 месяц",
  TWO_MONTHS: "2 месяца",
  THREE_MONTHS: "3 месяца",
  SIX_MONTHS: "6 месяцев",
  TWELVE_MONTHS: "12 месяцев",
  UNLIMITED: "Бессрочный",
};

export default function CoursePage() {
  const params = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { getCourseById, getAllLessons, isLoading: coursesLoading } = useCourses();
  const slugOrId = params.courseId as string;

  const course = getCourseById(slugOrId);
  const courseId = course?.id ?? slugOrId;
  const {
    getProgressPercentage,
    getCompletedCount,
    getTotalCount,
    progress: progressIds,
    getLastLessonId,
  } = useProgress(courseId);
  const { isPurchased, expirationInfo, currentPlan } = usePurchase(courseId);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handlePurchaseClick = () => {
    if (!isAuthenticated) {
      window.location.href = `/auth/register?course=${courseId}`;
      return;
    }
    setShowPurchaseModal(true);
  };

  if (authLoading || coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <>
        <Header />
        <main className="min-h-screen page-wrapper">
          <div className="container-custom max-w-4xl">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад к курсам</span>
            </Link>
            <div className="card text-center py-16">
              <h2 className="text-2xl font-bold text-dark-900 mb-2">
                Курс не найден
              </h2>
              <p className="text-dark-600 mb-6">
                Возможно, курс был удален или перемещен
              </p>
              <Link href="/courses" className="btn btn-primary">
                Посмотреть все курсы
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const progress = getProgressPercentage();
  const completed = getCompletedCount();
  const total = getTotalCount();
  const totalModules = course.modules.length;
  const freeLessonsCount = course.modules.reduce(
    (sum, module) => sum + module.lessons.filter((l) => l.isFree).length,
    0,
  );

  // Определяем следующий урок для кнопки "Начать/Продолжить обучение"
  const allLessons = getAllLessons(courseId);
  const lastLessonId = getLastLessonId();

  let nextLesson = allLessons.find((l) => !progressIds.includes(l.id));

  // Если есть последний урок, берем следующий после него
  if (lastLessonId) {
    const lastIndex = allLessons.findIndex((l) => l.id === lastLessonId);
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

  const nextLessonId = nextLesson ? nextLesson.id : null;

  // Функция для форматирования даты окончания доступа
  const formatExpirationDate = (expiresAt: number | null): string => {
    if (!expiresAt) return "Безлимитный доступ";

    const date = new Date(expiresAt);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Минимальная цена для отображения в aside
  const activePlans = (course.pricingPlans ?? []).filter((p) => p.isActive);
  const minPrice =
    activePlans.length > 0
      ? Math.min(...activePlans.map((p) => p.price))
      : null;
  const currency = activePlans[0]?.currency ?? "₸";

  return (
    <>
      <Header />
      <main className="min-h-screen page-wrapper">
        <div className="container-custom max-w-7xl">
          {/* Back Button */}
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-6 animate-fade-in"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к курсам</span>
          </Link>

          {/* Layout grid: контент + sticky aside на десктопе */}
          <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_400px] lg:gap-8 gap-6">
            {/* Course Hero */}
            <div className="card animate-slide-up lg:row-start-1 lg:col-start-1">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Course Image */}
                <div className="w-full md:w-1/3 lg:w-2/5 xl:w-1/3 h-48 md:h-auto md:min-h-[12rem] bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-20 h-20 lg:w-24 lg:h-24 text-primary-600" />
                </div>

                {/* Course Info */}
                <div className="flex-1">
                  <h1 className="mb-3 text-2xl md:text-3xl lg:text-4xl">
                    {course.title}
                  </h1>
                  <p className="text-base md:text-lg text-dark-600 mb-6">
                    {course.description}
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-3 md:gap-4">
                    <div className="flex items-center gap-2 text-dark-700">
                      <Layers className="w-5 h-5 text-primary-600" />
                      <span className="font-medium">
                        {totalModules} модулей
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-dark-700">
                      <Video className="w-5 h-5 text-primary-600" />
                      <span className="font-medium">{total} уроков</span>
                    </div>
                    {freeLessonsCount > 0 && (
                      <div className="flex items-center gap-2 text-dark-700">
                        <Lock className="w-5 h-5 text-green-600" />
                        <span className="font-medium">
                          {freeLessonsCount} бесплатных
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Aside: статус/покупка (sticky на десктопе) */}
            <aside className="lg:row-start-1 lg:row-span-2 lg:col-start-2 lg:sticky lg:top-24 lg:self-start space-y-4">
              {isPurchased ? (
                <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 animate-slide-up">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <span className="text-green-700 font-bold text-lg">
                      Полный доступ
                    </span>
                  </div>

                  {expirationInfo && (
                    <div className="mb-4 text-sm">
                      {expirationInfo.expiresAt ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-dark-600">
                            <Clock className="w-4 h-4" />
                            <span>
                              Доступ до:{" "}
                              <strong className="text-dark-900">
                                {formatExpirationDate(
                                  expirationInfo.expiresAt,
                                )}
                              </strong>
                            </span>
                          </div>
                          {expirationInfo.daysRemaining !== null &&
                            expirationInfo.daysRemaining <= 30 && (
                              <span
                                className={`inline-block badge text-xs ${
                                  expirationInfo.daysRemaining <= 7
                                    ? "bg-red-100 text-red-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                Осталось {expirationInfo.daysRemaining}{" "}
                                {expirationInfo.daysRemaining === 1
                                  ? "день"
                                  : expirationInfo.daysRemaining < 5
                                    ? "дня"
                                    : "дней"}
                              </span>
                            )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Безлимитный доступ
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-dark-600">
                        {progress > 0
                          ? `Прогресс: ${progress}%`
                          : "Начните обучение"}
                      </span>
                      <span className="text-sm font-semibold text-dark-700">
                        {completed}/{total}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {nextLessonId ? (
                    <Link
                      href={`/lesson/${nextLessonId}`}
                      className="btn btn-primary w-full flex items-center justify-center"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      {progress > 0 ? "Продолжить" : "Начать обучение"}
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard"
                      className="btn btn-primary w-full flex items-center justify-center"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Перейти к курсам
                    </Link>
                  )}
                </div>
              ) : (
                <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 animate-slide-up">
                  {/* Цена */}
                  {minPrice !== null && (
                    <div className="mb-4 pb-4 border-b border-primary-200">
                      <div className="text-sm text-dark-600 mb-1">От</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl lg:text-4xl font-bold text-primary-700">
                          {minPrice.toLocaleString()}
                        </span>
                        <span className="text-lg text-dark-600">
                          {currency}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlePurchaseClick}
                    className="btn btn-primary w-full mb-4"
                  >
                    {isAuthenticated
                      ? "Купить курс"
                      : "Зарегистрироваться и купить"}
                  </button>

                  {/* Тарифы */}
                  {activePlans.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-dark-700 uppercase tracking-wide mb-2">
                        Доступные тарифы:
                      </p>
                      {activePlans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`flex items-center justify-between p-3 rounded-lg bg-white border-2 ${
                            plan.isRecommended
                              ? "border-primary-500"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-dark-900 text-sm">
                                {plan.name}
                              </span>
                              {plan.isRecommended && (
                                <span className="text-[10px] font-bold bg-primary-600 text-white px-1.5 py-0.5 rounded uppercase">
                                  Топ
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-dark-500">
                              {ACCESS_LABEL[plan.accessPeriod] ??
                                plan.accessPeriod}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-dark-900">
                              {plan.price.toLocaleString()}
                            </div>
                            <div className="text-xs text-dark-500">
                              {plan.currency}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {freeLessonsCount > 0 && (
                    <p className="text-xs text-dark-600 mt-4 text-center">
                      💡 Доступно {freeLessonsCount} бесплатных{" "}
                      {freeLessonsCount === 1 ? "урок" : "уроков"} для
                      ознакомления
                    </p>
                  )}
                </div>
              )}
            </aside>

            {/* Course Content */}
            <div className="lg:row-start-2 lg:col-start-1">
              <h2 className="text-2xl md:text-3xl font-bold text-dark-900 mb-6">
                Программа курса
              </h2>
            <div className="space-y-4">
              {course.modules.map((module, index) => {
                // Вычисляем прогресс по модулю
                const completedLessons = module.lessons.filter((lesson) =>
                  progressIds.includes(lesson.id),
                ).length;
                const isModuleCompleted =
                  completedLessons === module.lessons.length &&
                  module.lessons.length > 0;
                const moduleProgress =
                  module.lessons.length > 0
                    ? Math.round(
                        (completedLessons / module.lessons.length) * 100,
                      )
                    : 0;

                return (
                  <div
                    key={module.id}
                    className="card animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Module Header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="text-lg md:text-xl font-bold text-dark-900 mb-2 flex items-center gap-2">
                            {isModuleCompleted && (
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            )}
                            {module.title}
                          </h3>
                          <p className="text-sm text-dark-600 mb-3">
                            {module.description}
                          </p>
                        </div>
                      </div>

                      {/* Статистика модуля */}
                      <div className="flex items-center gap-4 mb-2">
                        <div className="text-sm text-dark-500">
                          {module.lessons.length}{" "}
                          {module.lessons.length === 1 ? "урок" : "уроков"}
                        </div>
                        {completedLessons > 0 && (
                          <div className="text-sm font-medium text-green-600">
                            {completedLessons} пройдено
                          </div>
                        )}
                      </div>

                      {/* Прогресс-бар модуля */}
                      {completedLessons > 0 && !isModuleCompleted && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all duration-300"
                              style={{ width: `${moduleProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lessons Preview */}
                    <div className="space-y-2">
                      {module.lessons.map((lesson) => {
                        const isCompleted = progressIds.includes(lesson.id);
                        const isLocked = !lesson.isFree && !isPurchased;
                        const canAccess = lesson.isFree || isPurchased;
                        const isLastLesson = lesson.id === lastLessonId;

                        const lessonContent = (
                          <>
                            {isCompleted ? (
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              </div>
                            ) : lesson.isFree ? (
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Play className="w-4 h-4 text-green-600" />
                              </div>
                            ) : isLocked ? (
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <Lock className="w-4 h-4 text-gray-400" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Play className="w-4 h-4 text-primary-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${isCompleted ? "text-dark-700" : "text-dark-900"}`}
                              >
                                {lesson.title}
                              </p>
                              {isLastLesson && !isCompleted && (
                                <p className="text-xs text-primary-600 mt-0.5">
                                  Последний просмотр
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-dark-500 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              <span>{lesson.duration}</span>
                            </div>
                            {isCompleted && (
                              <span className="badge bg-green-100 text-green-700 text-xs">
                                Пройдено
                              </span>
                            )}
                            {!isCompleted && lesson.isFree && (
                              <span className="badge badge-free text-xs">
                                Бесплатно
                              </span>
                            )}
                          </>
                        );

                        return canAccess ? (
                          <Link
                            key={lesson.id}
                            href={`/lesson/${lesson.id}`}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                              isLastLesson && !isCompleted
                                ? "bg-primary-50 border-2 border-primary-200 hover:bg-primary-100"
                                : "bg-gray-50 hover:bg-gray-100"
                            }`}
                          >
                            {lessonContent}
                          </Link>
                        ) : (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-60 cursor-not-allowed"
                          >
                            {lessonContent}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>
      </main>

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        courseId={courseId}
      />
    </>
  );
}
