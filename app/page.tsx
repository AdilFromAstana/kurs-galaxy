"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Star,
  BookOpen,
  ArrowRight,
  Layers,
  Video,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCourses } from "@/components/providers/CoursesProvider";
import Header from "@/components/layout/Header";
import SiteFooter from "@/components/layout/SiteFooter";

function pluralCourse(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "Курсов";
  if (mod10 === 1) return "Курс";
  if (mod10 >= 2 && mod10 <= 4) return "Курса";
  return "Курсов";
}

function pluralLesson(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "Уроков";
  if (mod10 === 1) return "Урок";
  if (mod10 >= 2 && mod10 <= 4) return "Урока";
  return "Уроков";
}

export default function WelcomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { courses } = useCourses();
  const totalCourses = courses.length;
  const totalLessons = courses.reduce(
    (sum, course) =>
      sum +
      course.modules.reduce((mSum, module) => mSum + module.lessons.length, 0),
    0,
  );

  // Топ-3 курса для превью на главной (с активными тарифами и хотя бы одним разделом)
  const previewCourses = courses
    .filter(
      (c) =>
        c.modules.length > 0 &&
        c.pricingPlans?.some((p) => p.isActive),
    )
    .slice(0, 3);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen w-full flex flex-col">
        {/* Hero Section */}
        <section className="px-4 md:px-6 lg:px-8 py-10 md:py-16 lg:py-20 xl:py-24 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Левая колонка: текст + CTA */}
              <div className="text-center lg:text-left">
                {/* Title */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 md:mb-6 text-primary-600">
                  KursGalaxy.kz
                </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl lg:text-2xl xl:text-2xl text-dark-600 mb-8 md:mb-10 max-w-2xl mx-auto lg:mx-0">
                Профессиональное онлайн-обучение
                <br className="hidden md:block" />
                <span className="text-primary-600 font-semibold">
                  для специалистов beauty-индустрии
                </span>
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto lg:mx-0">
                <Link
                  href="/courses"
                  className="btn btn-primary flex-1 animate-scale-in"
                >
                  Посмотреть курсы
                </Link>
                <Link
                  href="/auth/login"
                  className="btn btn-secondary flex-1 animate-scale-in"
                  style={{ animationDelay: "0.1s" }}
                >
                  Войти
                </Link>
              </div>
            </div>

            {/* Правая колонка: декоративный визуал (на lg+) */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-square">
                {/* Карточка-превью */}
                <div className="relative bg-white rounded-2xl shadow-soft border border-gray-100 p-8 h-full flex flex-col justify-center items-center gap-6">
                  <div className="w-24 h-24 bg-primary-600 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl xl:text-4xl font-bold text-dark-900 mb-1">
                      {totalCourses} {pluralCourse(totalCourses)}
                    </div>
                    <div className="text-base text-dark-600">
                      {totalLessons} {pluralLesson(totalLessons)} в каталоге
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full">
                    <Star className="w-4 h-4 text-primary-600 fill-primary-600" />
                    <span className="text-sm font-semibold text-primary-700">
                      С сертификатом
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features (только мобильно/планшет) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-12 lg:hidden">
            <div className="card animate-slide-up">
              <div className="flex flex-col items-center text-center">
                <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-primary-500 mb-3" />
                <h3 className="text-base md:text-lg font-semibold mb-2">
                  {totalCourses} {pluralCourse(totalCourses)}
                </h3>
                <p className="text-sm md:text-base text-dark-600">
                  Профессиональные программы обучения
                </p>
              </div>
            </div>
            <div className="card animate-slide-up">
              <div className="flex flex-col items-center text-center">
                <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-primary-500 mb-3" />
                <h3 className="text-base md:text-lg font-semibold mb-2">
                  {totalLessons} {pluralLesson(totalLessons)}
                </h3>
                <p className="text-sm md:text-base text-dark-600">
                  Пошаговые видео-инструкции
                </p>
              </div>
            </div>
            <div className="card animate-slide-up">
              <div className="flex flex-col items-center text-center">
                <Star className="w-8 h-8 md:w-10 md:h-10 text-primary-500 mb-3" />
                <h3 className="text-base md:text-lg font-semibold mb-2">
                  Сертификат
                </h3>
                <p className="text-sm md:text-base text-dark-600">
                  После завершения каждого курса
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Preview Section */}
      {previewCourses.length > 0 && (
        <section className="px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-20 bg-white/50 backdrop-blur-sm border-y border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 md:mb-10 lg:mb-12">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-dark-900 mb-2 md:mb-3">
                Наши курсы
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-dark-600">
                Выберите курс и начните обучение сегодня
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8 lg:mb-10">
              {previewCourses.map((course, index) => {
                const lessonCount = course.modules.reduce(
                  (sum, m) => sum + m.lessons.length,
                  0,
                );
                const activePlans = (course.pricingPlans ?? []).filter(
                  (p) => p.isActive,
                );
                const minPrice =
                  activePlans.length > 0
                    ? Math.min(...activePlans.map((p) => p.price))
                    : null;
                const currency = activePlans[0]?.currency ?? "₸";

                return (
                  <Link
                    key={course.id}
                    href={`/course/${course.id}`}
                    className="card card-hover group flex flex-col animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-full h-40 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                      <BookOpen className="w-16 h-16 text-primary-600" />
                    </div>

                    <h3 className="text-lg font-bold text-dark-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-dark-600 mb-4 line-clamp-2 flex-1">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-4 mb-4 text-sm text-dark-500">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        <span>{course.modules.length} разд.</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Video className="w-4 h-4" />
                        <span>{lessonCount} ур.</span>
                      </div>
                    </div>

                    {minPrice !== null && (
                      <div className="flex items-baseline justify-between pt-3 border-t border-gray-200">
                        <span className="text-sm text-dark-500">От</span>
                        <span className="text-xl font-bold text-primary-600">
                          {minPrice.toLocaleString()} {currency}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="text-center">
              <Link
                href="/courses"
                className="btn btn-secondary inline-flex items-center gap-2"
              >
                Смотреть все курсы
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

        <SiteFooter />
      </div>
    </>
  );
}
