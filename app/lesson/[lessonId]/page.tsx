'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Download, ExternalLink, CheckCircle2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { usePurchase } from '@/hooks/usePurchase';
import { setLastLesson } from '@/lib/storage';
import Header from '@/components/layout/Header';
import VideoPlayer from '@/components/lesson/VideoPlayer';
import PurchaseModal from '@/components/modals/PurchaseModal';
import LessonMobileNav from '@/components/lesson/LessonMobileNav';
import { getLessonById, getNextLesson, getPreviousLesson } from '@/lib/courseData';

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const courseId = 'brow-master-pro'; // TODO: определять из урока
  const { addLesson, isLessonCompleted } = useProgress(courseId);
  const { hasAccess } = usePurchase(courseId);
  
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  
  const lessonId = params.lessonId as string;
  const lesson = getLessonById(lessonId);
  const nextLesson = getNextLesson(lessonId);
  const previousLesson = getPreviousLesson(lessonId);
  const completed = isLessonCompleted(lessonId);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  // Сохранить текущий урок как последний просмотренный
  useEffect(() => {
    if (lesson && isAuthenticated) {
      setLastLesson(lessonId, courseId);
    }
  }, [lessonId, lesson, isAuthenticated, courseId]);

  if (authLoading || !isAuthenticated || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Check access
  if (!hasAccess(lesson.isFree)) {
    return (
      <>
        <Header />
        <main className="min-h-screen page-wrapper">
          <div className="container-custom max-w-4xl">
            <Link href={`/course/${courseId}`} className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>Назад к курсу</span>
            </Link>
            
            <div className="card text-center py-12 md:py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-gray-400" />
              </div>
              <h1 className="mb-4">Урок заблокирован</h1>
              <p className="text-lg text-dark-600 mb-8">
                Этот урок доступен только после покупки полного курса
              </p>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="btn btn-primary"
              >
                Купить курс
              </button>
            </div>
          </div>
        </main>
        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={() => window.location.reload()}
          courseId={courseId}
        />
      </>
    );
  }

  const markAsCompleted = () => {
    if (!completed) {
      addLesson(lessonId);
    }
  };

  const handleCompleteLesson = () => {
    markAsCompleted();

    if (nextLesson) {
      if (!hasAccess(nextLesson.isFree)) {
        setShowPurchaseModal(true);
      } else {
        router.push(`/lesson/${nextLesson.id}`);
      }
    } else {
      router.push('/profile');
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen page-wrapper pb-24 md:pb-8">
        <div className="container-custom max-w-5xl">
          {/* Back Button */}
          <Link href={`/course/${courseId}`} className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-4 md:mb-6 animate-fade-in">
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к курсу</span>
          </Link>

          {/* Lesson Header */}
          <div className="mb-6 md:mb-8 animate-slide-up">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="flex-1">{lesson.title}</h1>
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
          <div className="mb-8 md:mb-12 animate-slide-up">
            <VideoPlayer lessonId={lesson.id} videoUrl={lesson.videoUrl} />
          </div>

          {/* Lesson Content */}
          <div className="card mb-6 md:mb-8 animate-slide-up">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Конспект урока</h2>
            <div className="lesson-content prose prose-lg max-w-none">
              {lesson.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <h1 key={i}>{line.substring(2)}</h1>;
                } else if (line.startsWith('## ')) {
                  return <h2 key={i}>{line.substring(3)}</h2>;
                } else if (line.startsWith('### ')) {
                  return <h3 key={i}>{line.substring(4)}</h3>;
                } else if (line.startsWith('> ')) {
                  return <blockquote key={i}>{line.substring(2)}</blockquote>;
                } else if (line.startsWith('- ')) {
                  return <li key={i}>{line.substring(2)}</li>;
                } else if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={i}><strong>{line.substring(2, line.length - 2)}</strong></p>;
                } else if (line.trim()) {
                  return <p key={i}>{line}</p>;
                } else {
                  return <br key={i} />;
                }
              })}
            </div>
          </div>

          {/* Materials */}
          {lesson.materials.length > 0 && (
            <div className="card mb-6 md:mb-8 animate-slide-up">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Материалы к уроку</h2>
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
                      {material.type === 'pdf' ? (
                        <Download className="w-5 h-5 text-primary-600 group-hover:text-white" />
                      ) : (
                        <ExternalLink className="w-5 h-5 text-primary-600 group-hover:text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-dark-900">{material.title}</p>
                      <p className="text-sm text-dark-500">
                        {material.type === 'pdf' ? 'PDF документ' : 'Внешняя ссылка'}
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
                  {nextLesson ? 'Готовы продолжить?' : 'Поздравляем!'}
                </h3>
                <p className="text-sm md:text-base text-dark-600">
                  {nextLesson 
                    ? `Следующий урок: ${nextLesson.title}`
                    : 'Вы завершили все уроки курса!'}
                </p>
              </div>
              <button
                onClick={handleCompleteLesson}
                className="btn btn-primary whitespace-nowrap"
              >
                {nextLesson 
                  ? completed ? 'Следующий урок' : 'Завершить и продолжить'
                  : 'Получить сертификат'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={() => window.location.reload()}
        courseId="brow-master-pro"
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
