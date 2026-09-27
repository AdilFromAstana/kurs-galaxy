'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, Gift, Layers, Play, Sparkles, TrendingUp, Video } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { usePurchase } from '@/hooks/usePurchase';
import { useCourses, type CourseDTO } from '@/components/providers/CoursesProvider';
import Header from '@/components/layout/Header';
import LandingFooter from '@/components/landing/LandingFooter';
import PurchaseModal from '@/components/modals/PurchaseModal';
import { focusRing, formatPrice, manrope, pinkButtonCls, plural } from '@/components/landing/shared';

export default function CoursesPage() {
  const { isAuthenticated } = useAuth();
  const { courses, isLoading } = useCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Только курсы с реальным контентом (фильтрует тестовый мусор без разделов)
  const visibleCourses = courses.filter((c) => c.modules.length > 0);

  const totalLessons = visibleCourses.reduce(
    (sum, c) => sum + c.modules.reduce((s, m) => s + m.lessons.length, 0),
    0,
  );

  const handlePurchaseClick = (courseId: string) => {
    if (!isAuthenticated) {
      window.location.href = `/auth/register?course=${courseId}`;
      return;
    }
    setSelectedCourseId(courseId);
    setShowPurchaseModal(true);
  };

  return (
    <>
      <Header />
      <main className={`${manrope.className} min-h-screen w-full bg-white text-landing-plum`}>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-landing-blush to-white">
          <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-landing-pink/15 blur-3xl" />
          <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-10 pt-12 md:px-6 md:pb-14 md:pt-20 lg:flex-row lg:items-end lg:justify-between lg:px-8">
            <div className="animate-fade-in motion-reduce:animate-none">
              <h1 className="text-[2.6rem] leading-[0.95] md:text-7xl font-extrabold uppercase tracking-tight">
                Каталог
                <br />
                <span className="text-landing-pink">курсов</span>
              </h1>
              <p className="mt-6 max-w-xl text-base md:text-xl text-landing-plum/80">
                Выберите курс и начните учиться в своём темпе — от первых бровей до высокого чека
              </p>
            </div>

            {visibleCourses.length > 0 && (
              <dl className="grid grid-cols-2 gap-4 border-t border-landing-plum/10 pt-6 lg:border-0 lg:pt-0">
                {[
                  { value: visibleCourses.length, label: plural(visibleCourses.length, 'курс', 'курса', 'курсов') },
                  { value: totalLessons, label: plural(totalLessons, 'урок', 'урока', 'уроков') },
                ].map((s) => (
                  <div key={s.label} className="rounded-3xl bg-white px-6 py-4 shadow-sm ring-1 ring-landing-plum/5">
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="text-3xl md:text-4xl font-extrabold">{s.value}</dd>
                    <dd className="text-xs md:text-sm font-semibold uppercase text-landing-plum/70">{s.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 pt-6 md:px-6 md:pb-28 lg:px-8">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[30rem] animate-pulse rounded-[32px] bg-landing-blush" />
              ))}
            </div>
          ) : visibleCourses.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  index={index}
                  isAuthenticated={isAuthenticated}
                  onPurchaseClick={handlePurchaseClick}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[32px] border-2 border-dashed border-landing-plum/15 bg-landing-cream p-12 text-center md:p-16">
              <BookOpen className="mx-auto mb-4 h-14 w-14 text-landing-pink/50" aria-hidden />
              <h2 className="text-2xl font-extrabold uppercase">Курсов пока нет</h2>
              <p className="mt-2 text-landing-plum/70">Скоро здесь появятся новые курсы</p>
            </div>
          )}
        </section>
      </main>

      <div className={manrope.className}>
        <LandingFooter />
      </div>

      {selectedCourseId && (
        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={() => setShowPurchaseModal(false)}
          courseId={selectedCourseId}
        />
      )}
    </>
  );
}

function CourseCard({
  course,
  index,
  isAuthenticated,
  onPurchaseClick,
}: {
  course: CourseDTO;
  index: number;
  isAuthenticated: boolean;
  onPurchaseClick: (courseId: string) => void;
}) {
  const { getProgressPercentage } = useProgress(course.id);
  const { isPurchased } = usePurchase(course.id);

  const progress = getProgressPercentage();
  const hasProgress = isAuthenticated && progress > 0;
  const totalModules = course.modules.length;
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const freeLessonsCount = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.isFree).length,
    0,
  );

  const isFreeCourse = course.isFree;
  const cheapest = isFreeCourse
    ? null
    : course.pricingPlans
        .filter((p) => p.isActive)
        .reduce<CourseDTO['pricingPlans'][number] | null>(
          (min, p) => (!min || p.price < min.price ? p : min),
          null,
        );
  const href = `/course/${course.id}`;

  const badge = isFreeCourse
    ? { icon: Gift, text: 'бесплатно' }
    : isPurchased
      ? { icon: CheckCircle2, text: 'доступ открыт' }
      : hasProgress
        ? { icon: TrendingUp, text: 'в процессе' }
        : freeLessonsCount > 0
          ? { icon: Gift, text: 'есть бесплатные уроки' }
          : { icon: Sparkles, text: 'онлайн' };
  const BadgeIcon = badge.icon;

  const btnCls = `${pinkButtonCls} !min-h-[48px] !px-5 !py-3 !text-sm`;

  return (
    <article
      className="group flex h-full flex-col rounded-[32px] bg-white p-3 shadow-[0_25px_60px_-30px_rgba(86,62,79,0.45)] ring-1 ring-landing-plum/5 transition-transform hover:-translate-y-1 animate-slide-up motion-reduce:transform-none motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
    >
      <Link href={href} className={`relative block overflow-hidden rounded-[24px] ${focusRing}`} tabIndex={-1} aria-hidden>
        <div className="relative aspect-[4/3] bg-landing-blush">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-16 w-16 text-landing-pink/40" />
            </div>
          )}
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-landing-pink shadow-sm">
            <BadgeIcon className="h-3.5 w-3.5" />
            {badge.text}
          </span>
          {hasProgress && (
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/60">
              <div className="h-full bg-landing-pink" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-5">
        <h3 className="text-xl font-extrabold uppercase leading-tight tracking-tight">
          <Link href={href} className={`rounded transition-colors hover:text-landing-pink ${focusRing}`}>
            {course.title}
          </Link>
        </h3>
        {course.description && (
          <p className="mt-2 line-clamp-3 text-sm text-landing-plum/75">{course.description}</p>
        )}

        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-landing-plum/70">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-landing-pink" aria-hidden />
            {totalModules} {plural(totalModules, 'раздел', 'раздела', 'разделов')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Video className="h-4 w-4 text-landing-pink" aria-hidden />
            {totalLessons} {plural(totalLessons, 'урок', 'урока', 'уроков')}
          </span>
        </p>
        {hasProgress && (
          <p className="mt-2 text-sm font-semibold text-landing-pink">Пройдено {progress}%</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-landing-plum/10 pt-5">
          <div>
            {isFreeCourse ? (
              <p className="text-2xl font-extrabold text-landing-pink">Бесплатно</p>
            ) : isPurchased ? (
              <p className="text-base font-bold">Полный доступ</p>
            ) : cheapest ? (
              <>
                <p className="text-xs font-semibold uppercase text-landing-plum/60">от</p>
                <p className="text-2xl font-extrabold text-landing-pink">
                  {formatPrice(cheapest.price, cheapest.currency)}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-landing-plum/60">Цена по запросу</p>
            )}
          </div>

          {isPurchased ? (
            <Link href={href} className={btnCls}>
              <Play className="h-4 w-4" aria-hidden />
              {hasProgress ? 'Продолжить' : 'Начать'}
            </Link>
          ) : cheapest ? (
            <button type="button" onClick={() => onPurchaseClick(course.id)} className={btnCls}>
              Купить
            </button>
          ) : (
            <Link href={href} className={btnCls}>
              Подробнее <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
