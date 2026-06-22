"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Layers,
  Video,
  Play,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useSession } from "@/components/providers/SessionProvider";
import {
  useCourses,
  type CourseDTO,
} from "@/components/providers/CoursesProvider";
import Header from "@/components/layout/Header";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { courses, isLoading: coursesLoading } = useCourses();
  const { isPurchaseActive } = useSession();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const { purchasedCourses, freeCourses } = useMemo(() => {
    const purchased: CourseDTO[] = [];
    const free: CourseDTO[] = [];
    courses.forEach((course) => {
      if (isPurchaseActive(course.id)) purchased.push(course);
      else free.push(course);
    });
    return { purchasedCourses: purchased, freeCourses: free };
  }, [courses, isPurchaseActive]);

  if (isLoading || coursesLoading || !isAuthenticated) {
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
          <div className="mb-6 md:mb-8 animate-fade-in">
            <h1 className="mb-2">Мои курсы</h1>
            <p className="text-lg md:text-xl text-dark-600">
              Управляйте своим обучением
            </p>
          </div>

          {purchasedCourses.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-dark-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                Купленные курсы ({purchasedCourses.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {purchasedCourses.map((course, index) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isPurchased
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {freeCourses.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-dark-900 mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-gray-600" />
                Бесплатные курсы ({freeCourses.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {freeCourses.map((course, index) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isPurchased={false}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {courses.length === 0 && (
            <div className="card text-center py-16">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-dark-900 mb-2">
                Нет доступных курсов
              </h2>
              <p className="text-dark-600 mb-6">
                Курсы появятся здесь, когда они будут добавлены
              </p>
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

function CourseCard({
  course,
  isPurchased,
  index,
}: {
  course: CourseDTO;
  isPurchased: boolean;
  index: number;
}) {
  const {
    getProgressPercentage,
    getCompletedCount,
    getTotalCount,
    progress: progressIds,
    getLastLessonId,
  } = useProgress(course.id);
  const { getAllLessons } = useCourses();

  const progress = getProgressPercentage();
  const completed = getCompletedCount();
  const total = getTotalCount();

  const totalModules = course.modules.length;
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  );
  const freeLessonsCount = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.isFree).length,
    0,
  );

  const getNextLessonId = () => {
    const allLessons = getAllLessons(course.id);
    const lastLessonId = getLastLessonId();
    let nextLesson = allLessons.find((l) => !progressIds.includes(l.id));
    if (lastLessonId) {
      const lastIndex = allLessons.findIndex((l) => l.id === lastLessonId);
      if (lastIndex >= 0 && lastIndex < allLessons.length - 1) {
        const potentialNext = allLessons[lastIndex + 1];
        if (!progressIds.includes(potentialNext.id)) nextLesson = potentialNext;
      }
    }
    if (!nextLesson) nextLesson = allLessons[0];
    return nextLesson ? nextLesson.id : null;
  };

  const nextLessonId = getNextLessonId();

  return (
    <div
      className="card card-hover animate-slide-up group"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="w-full h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center mb-4 group-hover:from-primary-200 group-hover:to-primary-300 transition-all">
        <BookOpen className="w-16 h-16 text-primary-600" />
      </div>

      <h3 className="text-xl font-bold text-dark-900 mb-2 group-hover:text-primary-600 transition-colors">
        {course.title}
      </h3>
      <p className="text-sm text-dark-600 mb-4 line-clamp-2">
        {course.description}
      </p>

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

      {progress > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dark-600">Прогресс</span>
            <span className="text-sm font-semibold text-primary-600">
              {progress}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-dark-500 mt-2">
            {completed} из {total} уроков завершено
          </p>
        </div>
      )}

      <div className="mb-4">
        {isPurchased ? (
          <span className="badge bg-green-100 text-green-700 flex items-center gap-2 w-full justify-center">
            <CheckCircle2 className="w-4 h-4" />
            Полный доступ
          </span>
        ) : (
          <span className="badge bg-gray-100 text-gray-600 flex items-center gap-2 w-full justify-center">
            <Lock className="w-4 h-4" />
            {freeLessonsCount} бесплатных{" "}
            {freeLessonsCount === 1 ? "урок" : "уроков"}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/course/${course.id}`}
          className="btn btn-secondary flex-1 text-sm flex items-center justify-center text-center"
        >
          Детали курса
        </Link>
        {isPurchased || progress > 0 ? (
          nextLessonId ? (
            <Link
              href={`/lesson/${nextLessonId}`}
              className="btn btn-primary flex-1 text-sm flex items-center justify-center gap-2 text-center"
            >
              <Play className="w-4 h-4" />
              {progress > 0 ? "Продолжить" : "Начать"}
            </Link>
          ) : (
            <Link
              href={`/course/${course.id}`}
              className="btn btn-primary flex-1 text-sm flex items-center justify-center gap-2 text-center"
            >
              <Play className="w-4 h-4" />
              Смотреть курс
            </Link>
          )
        ) : (
          <Link
            href={`/course/${course.id}`}
            className="btn btn-primary flex-1 text-sm flex items-center justify-center text-center"
          >
            Попробовать
          </Link>
        )}
      </div>
    </div>
  );
}
