"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  CheckCircle2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { usePurchase } from "@/hooks/usePurchase";
import { useCourses } from "@/components/providers/CoursesProvider";
import Header from "@/components/layout/Header";
import VideoPlayer from "@/components/lesson/VideoPlayer";
import PurchaseModal from "@/components/modals/PurchaseModal";
import LessonMobileNav from "@/components/lesson/LessonMobileNav";

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { getLessonById, getAllLessons, isLoading: coursesLoading } = useCourses();

  const lessonId = params.lessonId as string;
  const found = getLessonById(lessonId);
  const lesson = found?.lesson ?? null;
  const course = found?.course ?? null;
  const courseId = course?.id ?? "";

  const allLessons = course ? getAllLessons(course.id) : [];
  const idx = lesson ? allLessons.findIndex((l) => l.id === lesson.id) : -1;
  const nextLesson = idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null;
  const previousLesson = idx > 0 ? allLessons[idx - 1] : null;

  const { addLesson, isLessonCompleted } = useProgress(courseId);
  const { hasAccess } = usePurchase(courseId);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const completed = lesson ? isLessonCompleted(lesson.id) : false;

  // Сохранить текущий урок как последний просмотренный — только для авторизованных
  useEffect(() => {
    if (lesson && isAuthenticated) {
      fetch('/api/last-lesson', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id }),
      }).catch(() => {});
    }
  }, [lesson, isAuthenticated]);

  if (authLoading || coursesLoading || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Доступ:
  // - бесплатный урок открыт всем (включая гостей)
  // - платный требует user-сессии + активной покупки курса
  const canViewLesson = lesson.isFree || (isAuthenticated && hasAccess(lesson.isFree));

  if (!canViewLesson) {
    return (
      <>
        <Header />
        <main className="min-h-screen page-wrapper">
          <div className="container-custom max-w-4xl">
            <Link
              href={`/course/${courseId}`}
              className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад к курсу</span>
            </Link>

            <div className="card text-center py-12 md:py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-gray-400" />
              </div>
              <h1 className="mb-4">Урок заблокирован</h1>
              <p className="text-lg text-dark-600 mb-8">
                {isAuthenticated
                  ? 'Этот урок доступен только после покупки полного курса'
                  : 'Зарегистрируйтесь, чтобы купить курс и получить доступ ко всем урокам'}
              </p>
              {isAuthenticated ? (
                <button
                  onClick={() => setShowPurchaseModal(true)}
                  className="btn btn-primary"
                >
                  Купить курс
                </button>
              ) : (
                <Link
                  href={`/auth/register?course=${courseId}`}
                  className="btn btn-primary inline-block"
                >
                  Зарегистрироваться и купить
                </Link>
              )}
            </div>
          </div>
        </main>
        {isAuthenticated && (
          <PurchaseModal
            isOpen={showPurchaseModal}
            onClose={() => setShowPurchaseModal(false)}
            courseId={courseId}
          />
        )}
      </>
    );
  }

  const markAsCompleted = () => {
    if (!isAuthenticated) return; // гостям прогресс не сохраняем
    if (!completed) {
      addLesson(lessonId);
    }
  };

  const handleCompleteLesson = async () => {
    // Гость нажал «Зарегистрироваться, чтобы продолжить» — ведём на регистрацию
    if (!isAuthenticated) {
      router.push(`/auth/register?course=${courseId}`);
      return;
    }

    if (nextLesson) {
      // Не последний урок — отмечаем и идём дальше
      markAsCompleted();
      if (!hasAccess(nextLesson.isFree)) {
        setShowPurchaseModal(true);
      } else {
        router.push(`/lesson/${nextLesson.id}`);
      }
      return;
    }

    // Последний урок: ждём сохранения прогресса в БД,
    // потом открываем сертификат в новой вкладке.
    if (!completed) {
      await addLesson(lessonId);
    }
    if (courseId) {
      window.open(`/api/courses/${courseId}/certificate`, '_blank');
    }
  };

  // Прогресс по курсу для sidebar
  const courseTotalLessons = course?.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  ) ?? 0;
  const courseCompletedLessons = course?.modules.reduce(
    (sum, m) =>
      sum + m.lessons.filter((l) => isLessonCompleted(l.id)).length,
    0,
  ) ?? 0;
  const courseProgress =
    courseTotalLessons > 0
      ? Math.round((courseCompletedLessons / courseTotalLessons) * 100)
      : 0;

  return (
    <>
      <Header />
      <main className="min-h-screen page-wrapper pb-24 md:pb-8">
        <div className="container-custom max-w-7xl">
          {/* Back Button */}
          <Link
            href={`/course/${courseId}`}
            className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-4 md:mb-6 animate-fade-in"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к курсу</span>
          </Link>

          {/* Layout: контент урока + sidebar со списком уроков */}
          <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] lg:gap-8 gap-6">
            {/* Основной контент */}
            <div className="space-y-6 md:space-y-8 min-w-0">
              {/* Lesson Header */}
              <div className="animate-slide-up">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="flex-1 text-2xl md:text-3xl lg:text-4xl">
                    {lesson.title}
                  </h1>
                  {completed && (
                    <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Завершено</span>
                    </div>
                  )}
                </div>
                <p className="text-base md:text-lg text-dark-600">
                  Длительность: {lesson.duration}
                </p>
              </div>

              {/* Video Player */}
              <div className="animate-slide-up">
                <VideoPlayer lessonId={lesson.id} videoUrl={lesson.videoUrl} />
              </div>

              {/* Lesson Content */}
              <div className="card animate-slide-up">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
                  Конспект урока
                </h2>
                <div className="lesson-content prose prose-lg max-w-none prose-headings:text-dark-900 prose-a:text-primary-600 hover:prose-a:text-primary-700 prose-img:rounded-xl prose-img:shadow-md prose-blockquote:border-primary-500 prose-blockquote:bg-primary-50/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-code:text-primary-700 prose-code:bg-primary-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children, ...props }) => (
                        <a
                          href={href}
                          target={href?.startsWith('http') ? '_blank' : undefined}
                          rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                          {...props}
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {lesson.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Materials */}
              {lesson.materials.length > 0 && (
                <div className="card animate-slide-up">
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
                    Материалы к уроку
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {lesson.materials.map((material, index) => (
                      <a
                        key={index}
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
                      >
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-500 transition-colors">
                          {material.type === "PDF" ||
                          (material.type as string) === "pdf" ? (
                            <Download className="w-5 h-5 text-primary-600 group-hover:text-white" />
                          ) : (
                            <ExternalLink className="w-5 h-5 text-primary-600 group-hover:text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-dark-900">
                            {material.title}
                          </p>
                          <p className="text-sm text-dark-500">
                            {material.type === "PDF" ||
                            (material.type as string) === "pdf"
                              ? "PDF документ"
                              : "Внешняя ссылка"}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 animate-slide-up">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg md:text-xl font-bold text-dark-900 mb-1">
                      {!isAuthenticated
                        ? "Понравился урок?"
                        : nextLesson
                          ? "Готовы продолжить?"
                          : "Поздравляем!"}
                    </h3>
                    <p className="text-sm md:text-base text-dark-600">
                      {!isAuthenticated
                        ? "Зарегистрируйтесь, чтобы получить доступ ко всем урокам курса"
                        : nextLesson
                          ? `Следующий урок: ${nextLesson.title}`
                          : "Вы завершили все уроки курса!"}
                    </p>
                  </div>
                  <button
                    onClick={handleCompleteLesson}
                    className="btn btn-primary whitespace-nowrap"
                  >
                    {!isAuthenticated
                      ? "Зарегистрироваться"
                      : nextLesson
                        ? completed
                          ? "Следующий урок"
                          : "Завершить и продолжить"
                        : "Получить сертификат"}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar (на десктопе sticky) */}
            {course && (
              <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
                <div className="card !p-0 overflow-hidden">
                  {/* Заголовок курса */}
                  <div className="p-5 bg-gradient-to-br from-primary-50 to-primary-100 border-b border-primary-200">
                    <Link
                      href={`/course/${courseId}`}
                      className="text-xs font-semibold text-primary-700 uppercase tracking-wide hover:underline"
                    >
                      Курс
                    </Link>
                    <h3 className="font-bold text-dark-900 mt-1 mb-3 line-clamp-2">
                      {course.title}
                    </h3>
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="text-dark-600">
                        Прогресс: {courseProgress}%
                      </span>
                      <span className="text-dark-500">
                        {courseCompletedLessons}/{courseTotalLessons}
                      </span>
                    </div>
                    <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 transition-all duration-300"
                        style={{ width: `${courseProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Список модулей и уроков */}
                  <div className="p-3 space-y-3">
                    {course.modules.map((module) => (
                      <div key={module.id}>
                        <div className="px-2 py-1.5 mb-1">
                          <h4 className="text-sm font-bold text-dark-900 line-clamp-2">
                            {module.title}
                          </h4>
                        </div>
                        <div className="space-y-1">
                          {module.lessons.map((m) => {
                            const isCurrent = m.id === lessonId;
                            const isLessonDone = isLessonCompleted(m.id);
                            const canAccessLesson = hasAccess(m.isFree);

                            const inner = (
                              <>
                                <div className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center">
                                  {isLessonDone ? (
                                    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    </div>
                                  ) : !canAccessLesson ? (
                                    <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                                    </div>
                                  ) : (
                                    <div
                                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                        isCurrent
                                          ? "bg-primary-600"
                                          : "bg-primary-100"
                                      }`}
                                    >
                                      <span
                                        className={`text-xs font-bold ${
                                          isCurrent
                                            ? "text-white"
                                            : "text-primary-600"
                                        }`}
                                      >
                                        ▶
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm font-medium line-clamp-2 ${
                                      isCurrent
                                        ? "text-primary-700"
                                        : "text-dark-900"
                                    }`}
                                  >
                                    {m.title}
                                  </p>
                                  <p className="text-xs text-dark-500 mt-0.5">
                                    {m.duration}
                                    {m.isFree && !isLessonDone && (
                                      <span className="ml-2 text-green-600 font-medium">
                                        Бесплатно
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </>
                            );

                            const baseClass = `flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                              isCurrent
                                ? "bg-primary-50 ring-1 ring-primary-300"
                                : canAccessLesson
                                  ? "hover:bg-gray-50"
                                  : "opacity-50 cursor-not-allowed"
                            }`;

                            return canAccessLesson ? (
                              <Link
                                key={m.id}
                                href={`/lesson/${m.id}`}
                                className={baseClass}
                              >
                                {inner}
                              </Link>
                            ) : (
                              <div key={m.id} className={baseClass}>
                                {inner}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        courseId={courseId}
      />

      <LessonMobileNav
        previousLesson={previousLesson}
        nextLesson={nextLesson}
        currentLessonId={lessonId}
        hasAccess={hasAccess}
        onLocked={() => setShowPurchaseModal(true)}
        onCompleteLesson={markAsCompleted}
      />
    </>
  );
}
