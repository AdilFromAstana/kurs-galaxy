"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Gift,
  Layers,
  Lock,
  Play,
  PlayCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { usePurchase } from "@/hooks/usePurchase";
import { useCourses, type CourseModule } from "@/components/providers/CoursesProvider";
import Header from "@/components/layout/Header";
import LandingFooter from "@/components/landing/LandingFooter";
import PurchaseModal from "@/components/modals/PurchaseModal";
import {
  focusRing,
  formatPrice,
  manrope,
  outlineButtonCls,
  pinkButtonCls,
  plural,
} from "@/components/landing/shared";

const ACCESS_LABEL: Record<string, string> = {
  ONE_MONTH: "доступ 1 месяц",
  TWO_MONTHS: "доступ 2 месяца",
  THREE_MONTHS: "доступ 3 месяца",
  SIX_MONTHS: "доступ 6 месяцев",
  TWELVE_MONTHS: "доступ 12 месяцев",
  UNLIMITED: "бессрочный доступ",
};

const PERKS = [
  { icon: Smartphone, text: "Смотрите с телефона и компьютера" },
  { icon: Clock, text: "Учитесь в своём темпе" },
  { icon: ShieldCheck, text: "Безопасная оплата картой" },
];

const num = (i: number) => String(i + 1).padStart(2, "0");

function formatExpirationDate(expiresAt: number) {
  return new Date(expiresAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className={`${manrope.className} min-h-screen w-full bg-white text-landing-plum`}>
        {children}
      </main>
    </>
  );
}

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
  const { isPurchased, isFree: courseIsFree, expirationInfo } = usePurchase(courseId);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  // null — пользователь ещё не трогал аккордеон, открыт раздел по умолчанию
  const [openModules, setOpenModules] = useState<Set<string> | null>(null);

  const handlePurchaseClick = () => {
    if (!isAuthenticated) {
      window.location.href = `/auth/register?course=${courseId}`;
      return;
    }
    setShowPurchaseModal(true);
  };

  if (authLoading || coursesLoading) {
    return (
      <Shell>
        <div className="flex min-h-[70vh] items-center justify-center" role="status">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-landing-pink border-t-transparent" />
          <span className="sr-only">Загрузка курса…</span>
        </div>
      </Shell>
    );
  }

  if (!course) {
    return (
      <Shell>
        <section className="bg-gradient-to-b from-landing-blush to-white">
          <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
            <p className="text-6xl font-extrabold text-landing-pink">404</p>
            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold uppercase tracking-tight">
              Курс не найден
            </h1>
            <p className="mt-3 text-landing-plum/75">Возможно, курс был удалён или перемещён</p>
            <Link href="/#courses" className={`${pinkButtonCls} mt-8`}>
              Посмотреть все курсы
            </Link>
          </div>
        </section>
      </Shell>
    );
  }

  const progress = getProgressPercentage();
  const completed = getCompletedCount();
  const total = getTotalCount();
  const totalModules = course.modules.length;
  const freeLessonsCount = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.isFree).length,
    0,
  );

  // Следующий урок для кнопки «Начать/Продолжить обучение»
  const allLessons = getAllLessons(courseId);
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
  const nextLessonId = nextLesson?.id ?? null;
  const firstFreeLesson = allLessons.find((l) => l.isFree);

  const activePlans = courseIsFree
    ? []
    : (course.pricingPlans ?? [])
        .filter((p) => p.isActive)
        .sort((a, b) => a.order - b.order);
  const cheapest = activePlans.reduce<(typeof activePlans)[number] | null>(
    (min, p) => (!min || p.price < min.price ? p : min),
    null,
  );

  // По умолчанию раскрыт раздел со следующим уроком (или первый)
  const defaultOpen =
    course.modules.find((m) => m.lessons.some((l) => l.id === nextLessonId))?.id ??
    course.modules[0]?.id;
  const isOpen = (id: string) => (openModules ? openModules.has(id) : id === defaultOpen);
  const toggleModule = (id: string) => {
    const next = new Set(openModules ?? (defaultOpen ? [defaultOpen] : []));
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenModules(next);
  };
  const allOpen = course.modules.every((m) => isOpen(m.id));
  const toggleAll = () =>
    setOpenModules(allOpen ? new Set() : new Set(course.modules.map((m) => m.id)));

  const statusLabel = courseIsFree
    ? "бесплатный курс"
    : isPurchased
      ? "полный доступ"
      : "онлайн-курс";

  return (
    <Shell>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-landing-blush to-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-landing-pink/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 md:px-6 md:pb-16 md:pt-12 lg:px-8">
          <Link
            href="/#courses"
            className={`mb-8 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-landing-plum/80 shadow-sm transition-colors hover:text-landing-pink ${focusRing}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Все курсы
          </Link>

          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
            <div className="animate-fade-in motion-reduce:animate-none">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs md:text-sm font-bold uppercase tracking-widest text-landing-pink shadow-sm">
                {isPurchased && !courseIsFree ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                ) : (
                  <Sparkles className="h-4 w-4" aria-hidden />
                )}
                {statusLabel}
              </p>
              <h1 className="break-words text-3xl leading-[1.05] md:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight">
                {course.title}
              </h1>
              {course.description && (
                <p className="mt-6 max-w-xl whitespace-pre-line text-base md:text-lg text-landing-plum/80">
                  {course.description}
                </p>
              )}

              <dl className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-landing-plum/10 pt-6">
                {[
                  { value: totalModules, label: plural(totalModules, "раздел", "раздела", "разделов") },
                  { value: total, label: plural(total, "урок", "урока", "уроков") },
                  courseIsFree
                    ? { value: "0 ₸", label: "бесплатно" }
                    : { value: freeLessonsCount, label: "бесплатно" },
                ].map((s, i) => (
                  <div key={i}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="text-3xl md:text-4xl font-extrabold">{s.value}</dd>
                    <dd className="text-xs md:text-sm font-semibold uppercase text-landing-plum/70">
                      {s.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none animate-scale-in motion-reduce:animate-none">
              <div className="rounded-[36px] bg-white p-3 shadow-[0_30px_70px_-25px_rgba(245,73,160,0.55)] ring-1 ring-landing-plum/5">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-landing-blush">
                  {course.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-20 w-20 text-landing-pink/40" aria-hidden />
                    </div>
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-landing-pink shadow-sm">
                    онлайн
                  </span>
                </div>
              </div>
              {cheapest && !isPurchased && (
                <div className="absolute -bottom-5 left-3 rounded-2xl bg-landing-plum px-5 py-3 text-white shadow-xl md:-left-6">
                  <p className="text-xs font-semibold uppercase text-white/70">от</p>
                  <p className="text-xl font-extrabold">{formatPrice(cheapest.price, cheapest.currency)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Программа + покупка ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-6 md:pb-28 md:pt-12 lg:px-8">
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
          {/* Aside идёт первым в DOM, чтобы на мобильном цена была сразу под hero */}
          <aside className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[32px] bg-white p-6 shadow-[0_25px_60px_-30px_rgba(86,62,79,0.45)] ring-1 ring-landing-plum/10 md:p-8">
              {isPurchased ? (
                <>
                  <p className="flex items-center gap-2 text-lg font-extrabold uppercase">
                    <CheckCircle2 className="h-6 w-6 text-landing-pink" aria-hidden />
                    {courseIsFree ? "Курс бесплатный" : "Курс открыт"}
                  </p>

                  {!courseIsFree && expirationInfo && (
                    <p className="mt-3 text-sm text-landing-plum/75">
                      {expirationInfo.expiresAt ? (
                        <>
                          Доступ до{" "}
                          <strong className="text-landing-plum">
                            {formatExpirationDate(expirationInfo.expiresAt)}
                          </strong>
                          {expirationInfo.daysRemaining !== null && expirationInfo.daysRemaining <= 30 && (
                            <span
                              className={`ml-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                expirationInfo.daysRemaining <= 7
                                  ? "bg-red-100 text-red-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              осталось {expirationInfo.daysRemaining}{" "}
                              {plural(expirationInfo.daysRemaining, "день", "дня", "дней")}
                            </span>
                          )}
                        </>
                      ) : (
                        "Бессрочный доступ"
                      )}
                    </p>
                  )}

                  {isAuthenticated && (
                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-semibold text-landing-plum/75">
                          {progress > 0 ? `Прогресс ${progress}%` : "Вы ещё не начали"}
                        </span>
                        <span className="font-bold">
                          {completed}/{total}
                        </span>
                      </div>
                      <div
                        className="h-2.5 overflow-hidden rounded-full bg-landing-blush"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Прогресс курса"
                      >
                        <div
                          className="h-full rounded-full bg-landing-pink transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Link
                    href={
                      !isAuthenticated
                        ? `/auth/register?course=${courseId}`
                        : nextLessonId
                          ? `/lesson/${nextLessonId}`
                          : "/dashboard"
                    }
                    className={`${pinkButtonCls} mt-6 w-full`}
                  >
                    <Play className="h-5 w-5" aria-hidden />
                    {!isAuthenticated
                      ? "Начать бесплатно"
                      : progress > 0
                        ? "Продолжить"
                        : "Начать обучение"}
                  </Link>
                </>
              ) : cheapest ? (
                <>
                  <p className="text-sm font-semibold uppercase text-landing-plum/70">стоимость</p>
                  <p className="mt-1 text-4xl md:text-5xl font-extrabold text-landing-pink">
                    <span className="mr-2 text-xl font-bold text-landing-plum/60">от</span>
                    {formatPrice(cheapest.price, cheapest.currency)}
                  </p>

                  {activePlans.length > 0 && (
                    <ul className="mt-6 space-y-2" aria-label="Тарифы">
                      {activePlans.map((plan) => (
                        <li
                          key={plan.id}
                          className={`flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 ${
                            plan.isRecommended
                              ? "border-landing-pink bg-landing-blush"
                              : "border-landing-plum/10"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-bold">
                              <span className="truncate">{plan.name}</span>
                              {plan.isRecommended && (
                                <span className="shrink-0 rounded-full bg-landing-pink px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                                  хит
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-landing-plum/65">
                              {ACCESS_LABEL[plan.accessPeriod] ?? plan.accessPeriod}
                            </p>
                          </div>
                          <p className="shrink-0 font-extrabold">
                            {formatPrice(plan.price, plan.currency)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button type="button" onClick={handlePurchaseClick} className={`${pinkButtonCls} mt-6 w-full`}>
                    {isAuthenticated ? "Купить курс" : "Записаться на курс"}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                  {firstFreeLesson && (
                    <Link href={`/lesson/${firstFreeLesson.id}`} className={`${outlineButtonCls} mt-3 w-full`}>
                      <PlayCircle className="h-5 w-5" aria-hidden />
                      Смотреть бесплатно
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <p className="text-2xl font-extrabold uppercase">Запись открыта</p>
                  <p className="mt-2 text-landing-plum/75">
                    Оставьте заявку — расскажем о программе, тарифах и стоимости обучения.
                  </p>
                  <a href="#contacts" className={`${pinkButtonCls} mt-6 w-full`}>
                    Узнать стоимость
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                  {firstFreeLesson && (
                    <Link href={`/lesson/${firstFreeLesson.id}`} className={`${outlineButtonCls} mt-3 w-full`}>
                      <PlayCircle className="h-5 w-5" aria-hidden />
                      Смотреть бесплатно
                    </Link>
                  )}
                </>
              )}

              <ul className="mt-6 space-y-2.5 border-t border-landing-plum/10 pt-6 text-sm text-landing-plum/80">
                {freeLessonsCount > 0 && !courseIsFree && (
                  <li className="flex items-center gap-3">
                    <Gift className="h-5 w-5 shrink-0 text-landing-pink" aria-hidden />
                    {freeLessonsCount} {plural(freeLessonsCount, "урок", "урока", "уроков")} можно
                    посмотреть бесплатно
                  </li>
                )}
                {PERKS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-landing-pink" aria-hidden />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Программа курса */}
          <div className="lg:col-start-1 lg:row-start-1">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight leading-[1.05]">
                Программа
                <br />
                <span className="text-landing-pink">курса</span>
              </h2>
              {course.modules.length > 1 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className={`rounded-full px-4 py-2 text-sm font-bold text-landing-pink transition-colors hover:bg-landing-blush ${focusRing}`}
                >
                  {allOpen ? "Свернуть все" : "Развернуть все"}
                </button>
              )}
            </div>

            <ol className="space-y-3">
              {course.modules.map((module, index) => (
                <ModuleItem
                  key={module.id}
                  module={module}
                  index={index}
                  open={isOpen(module.id)}
                  onToggle={() => toggleModule(module.id)}
                  progressIds={progressIds}
                  isPurchased={isPurchased}
                  lastLessonId={lastLessonId}
                />
              ))}
            </ol>
          </div>
        </div>
      </section>

      <LandingFooter />

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        courseId={courseId}
      />
    </Shell>
  );
}

function ModuleItem({
  module,
  index,
  open,
  onToggle,
  progressIds,
  isPurchased,
  lastLessonId,
}: {
  module: CourseModule;
  index: number;
  open: boolean;
  onToggle: () => void;
  progressIds: string[];
  isPurchased: boolean;
  lastLessonId: string | null;
}) {
  const panelId = `module-${module.id}`;
  const done = module.lessons.filter((l) => progressIds.includes(l.id)).length;
  const isDone = done === module.lessons.length && module.lessons.length > 0;
  const n = module.lessons.length;

  return (
    <li
      className={`overflow-hidden rounded-[28px] transition-colors ${
        open ? "bg-landing-blush" : "bg-landing-cream ring-1 ring-landing-plum/5"
      }`}
    >
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className={`flex w-full items-center gap-4 rounded-[28px] p-5 text-left md:p-6 ${focusRing}`}
        >
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-extrabold ${
              isDone ? "bg-landing-pink text-white" : "bg-white text-landing-pink"
            }`}
            aria-hidden
          >
            {isDone ? <CheckCircle2 className="h-6 w-6" /> : num(index)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base md:text-lg font-extrabold leading-snug">{module.title}</span>
            <span className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-landing-plum/65">
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" aria-hidden />
                {n} {plural(n, "урок", "урока", "уроков")}
              </span>
              {done > 0 && (
                <span className="font-semibold text-landing-pink">
                  {done} из {n} пройдено
                </span>
              )}
            </span>
          </span>
          <ChevronDown
            className={`h-6 w-6 shrink-0 text-landing-pink transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </h3>

      <div id={panelId} hidden={!open} className="px-3 pb-3 md:px-4 md:pb-4">
        {module.description && (
          <p className="px-3 pb-3 text-sm text-landing-plum/75 md:px-2">{module.description}</p>
        )}
        <ul className="space-y-2">
          {module.lessons.map((lesson) => {
            const isCompleted = progressIds.includes(lesson.id);
            const canAccess = lesson.isFree || isPurchased;
            const isLast = lesson.id === lastLessonId && !isCompleted;

            const body = (
              <>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isCompleted
                      ? "bg-landing-pink text-white"
                      : canAccess
                        ? "bg-landing-blush text-landing-pink"
                        : "bg-landing-plum/5 text-landing-plum/40"
                  }`}
                  aria-hidden
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : canAccess ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm md:text-base font-semibold">{lesson.title}</span>
                  {isLast && <span className="text-xs font-semibold text-landing-pink">последний просмотр</span>}
                </span>
                {lesson.duration && (
                  <span className="hidden shrink-0 items-center gap-1 text-xs text-landing-plum/60 sm:inline-flex">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {lesson.duration}
                  </span>
                )}
                {isCompleted ? (
                  <span className="shrink-0 rounded-full bg-landing-pink/10 px-2.5 py-1 text-xs font-bold text-landing-pink">
                    пройдено
                  </span>
                ) : (
                  lesson.isFree &&
                  !isPurchased && (
                    <span className="shrink-0 rounded-full bg-landing-pink px-2.5 py-1 text-xs font-bold text-white">
                      бесплатно
                    </span>
                  )
                )}
                {!canAccess && <span className="sr-only">(доступно после покупки)</span>}
              </>
            );

            const rowCls = `flex items-center gap-3 rounded-2xl bg-white px-3 py-3 md:px-4 ${
              isLast ? "ring-2 ring-landing-pink" : ""
            }`;

            return (
              <li key={lesson.id}>
                {canAccess ? (
                  <Link
                    href={`/lesson/${lesson.id}`}
                    className={`${rowCls} transition-all hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none ${focusRing}`}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className={`${rowCls} text-landing-plum/60`}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  );
}
