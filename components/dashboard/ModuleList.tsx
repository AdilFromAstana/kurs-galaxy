'use client';

import Link from 'next/link';
import { Lock, Unlock, CheckCircle2, PlayCircle, Clock } from 'lucide-react';
import { getCourseById } from '@/lib/courseData';
import { useProgress } from '@/hooks/useProgress';
import { usePurchase } from '@/hooks/usePurchase';

interface ModuleListProps {
  courseId: string;
}

export default function ModuleList({ courseId }: ModuleListProps) {
  const course = getCourseById(courseId);
  const { isLessonCompleted } = useProgress(courseId);
  const { hasAccess } = usePurchase(courseId);

  if (!course) {
    return (
      <div className="card text-center py-12">
        <p className="text-dark-600">Курс не найден</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {course.modules.map((module, moduleIndex) => (
        <div key={module.id} className="card animate-slide-up" style={{ animationDelay: `${moduleIndex * 0.1}s` }}>
          {/* Module Header */}
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-dark-900 mb-2">
              {module.title}
            </h2>
            <p className="text-sm md:text-base text-dark-600">
              {module.description}
            </p>
          </div>

          {/* Lessons List */}
          <div className="space-y-2 md:space-y-3">
            {module.lessons.map((lesson, lessonIndex) => {
              const completed = isLessonCompleted(lesson.id);
              const accessible = hasAccess(lesson.isFree);
              
              const lessonContent = (
                <div
                  className={`
                    flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl transition-all
                    ${accessible ? 'hover:bg-gray-50 cursor-pointer active:scale-98' : 'opacity-60 cursor-not-allowed'}
                    ${completed ? 'bg-primary-50' : 'bg-white border border-gray-200'}
                  `}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {completed ? (
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                    ) : accessible ? (
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <PlayCircle className="w-5 h-5 md:w-6 md:h-6 text-primary-500" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Lock className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Lesson Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm md:text-base font-semibold text-dark-900 mb-1 truncate">
                      {lesson.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 text-xs md:text-sm text-dark-500">
                        <Clock className="w-3 h-3 md:w-4 md:h-4" />
                        <span>{lesson.duration}</span>
                      </div>
                      
                      {lesson.isFree && (
                        <span className="badge badge-free">
                          Бесплатно
                        </span>
                      )}
                      
                      {completed && (
                        <span className="badge badge-completed">
                          Завершено
                        </span>
                      )}
                      
                      {!accessible && (
                        <span className="badge badge-locked">
                          Заблокировано
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow Icon */}
                  {accessible && (
                    <div className="flex-shrink-0 hidden sm:block">
                      <svg
                        className="w-5 h-5 text-dark-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );

              return accessible ? (
                <Link key={lesson.id} href={`/lesson/${lesson.id}`}>
                  {lessonContent}
                </Link>
              ) : (
                <div key={lesson.id}>
                  {lessonContent}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
