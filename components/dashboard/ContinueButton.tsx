'use client';

import Link from 'next/link';
import { Play, CheckCircle2 } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { getAllLessons } from '@/lib/courseData';

interface ContinueButtonProps {
  courseId: string;
}

export default function ContinueButton({ courseId }: ContinueButtonProps) {
  const { progress, isFullyCompleted, getLastLessonId } = useProgress(courseId);
  
  if (isFullyCompleted()) {
    return (
      <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 animate-slide-up">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold text-green-900 mb-1">
              Поздравляем! 🎉
            </h3>
            <p className="text-sm md:text-base text-green-700">
              Вы завершили все уроки курса
            </p>
          </div>
          <Link href="/profile" className="btn btn-primary text-sm md:text-base">
            Сертификат
          </Link>
        </div>
      </div>
    );
  }

  // Найти следующий незавершенный урок
  const lastLessonId = getLastLessonId();
  const allLessons = getAllLessons(courseId);
  
  let nextLesson = allLessons.find(l => !progress.includes(l.id));
  
  // Если есть последний урок, берем следующий после него
  if (lastLessonId) {
    const lastIndex = allLessons.findIndex(l => l.id === lastLessonId);
    if (lastIndex >= 0 && lastIndex < allLessons.length - 1) {
      const potentialNext = allLessons[lastIndex + 1];
      if (!progress.includes(potentialNext.id)) {
        nextLesson = potentialNext;
      }
    }
  }

  if (!nextLesson) {
    nextLesson = allLessons[0];
  }

  return (
    <Link 
      href={`/lesson/${nextLesson.id}`}
      className="card card-hover bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 animate-slide-up block"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Play className="w-7 h-7 md:w-8 md:h-8 text-white ml-1" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-bold text-primary-900 mb-1">
            Продолжить обучение
          </h3>
          <p className="text-sm md:text-base text-primary-700">
            {nextLesson.title}
          </p>
        </div>
        <div className="hidden sm:block text-sm text-primary-600 font-medium">
          {nextLesson.duration}
        </div>
      </div>
    </Link>
  );
}
