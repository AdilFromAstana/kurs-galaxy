'use client';

import { useProgress } from '@/hooks/useProgress';

interface ProgressWidgetProps {
  courseId: string;
}

export default function ProgressWidget({ courseId }: ProgressWidgetProps) {
  const { getProgressPercentage, getCompletedCount, getTotalCount } = useProgress(courseId);
  
  const percentage = getProgressPercentage();
  const completed = getCompletedCount();
  const total = getTotalCount();

  // Вычисление для SVG круга
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="card card-hover animate-slide-up">
      <h2 className="text-xl md:text-2xl font-bold text-dark-900 mb-4 md:mb-6">
        Ваш прогресс
      </h2>
      
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Circular Progress */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="transform -rotate-90 w-32 h-32">
            {/* Background Circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            {/* Progress Circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-primary-500 transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-dark-900">
              {percentage}%
            </span>
          </div>
        </div>
        
        {/* Progress Info */}
        <div className="flex-1 text-center sm:text-left">
          <p className="text-lg md:text-xl text-dark-700 mb-2">
            Пройдено уроков
          </p>
          <p className="text-3xl md:text-4xl font-bold text-primary-600">
            {completed}{' '}
            <span className="text-xl md:text-2xl text-dark-400">
              из {total}
            </span>
          </p>
          
          {percentage === 100 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium animate-scale-in">
              <span className="text-lg">🎉</span>
              Курс завершен!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
