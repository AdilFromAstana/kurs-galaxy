'use client';

import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Lesson } from '@/types';

interface LessonMobileNavProps {
  previousLesson: Lesson | null;
  nextLesson: Lesson | null;
  currentLessonId: string;
  hasAccess: (isFree: boolean) => boolean;
  onLocked: () => void;
  onCompleteLesson?: () => void;
}

export default function LessonMobileNav({
  previousLesson,
  nextLesson,
  currentLessonId,
  hasAccess,
  onLocked,
  onCompleteLesson
}: LessonMobileNavProps) {
  const router = useRouter();

  const handlePrevious = () => {
    if (previousLesson) {
      router.push(`/lesson/${previousLesson.id}`);
    }
  };

  const handleNext = () => {
    if (!nextLesson) return;
    
    if (!hasAccess(nextLesson.isFree)) {
      onLocked();
      return;
    }
    
    // Отмечаем текущий урок как пройденный при переходе к следующему
    if (onCompleteLesson) {
      onCompleteLesson();
    }
    
    router.push(`/lesson/${nextLesson.id}`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] z-50 md:hidden">
      <div className="flex items-center justify-between gap-2 p-3">
        {/* Кнопка "Предыдущий" */}
        <button
          onClick={handlePrevious}
          disabled={!previousLesson}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
            previousLesson
              ? 'bg-gray-100 text-dark-900 hover:bg-gray-200 active:scale-95'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Пред.</span>
        </button>

        {/* Кнопка "Следующий" */}
        <button
          onClick={handleNext}
          disabled={!nextLesson}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
            nextLesson
              ? 'bg-primary-500 text-white hover:bg-primary-600 active:scale-95'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>След.</span>
          {nextLesson && !hasAccess(nextLesson.isFree) ? (
            <Lock className="w-4 h-4" />
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
