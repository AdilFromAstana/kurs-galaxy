"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gem,
  Sparkles,
  TrendingUp,
  Users,
  Video,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCourses, type CourseDTO } from "@/components/providers/CoursesProvider";
import type { LandingContentData, WorkPhoto } from "@/lib/landingContent";
import { hasSection, useLandingContent } from "@/hooks/useLandingContent";
import { PREVIEW_DRAFT_COURSE_ID, isPreviewFrame, usePreviewDraft } from "@/lib/preview";
import Header from "@/components/layout/Header";
import LandingFooter from "@/components/landing/LandingFooter";
import { focusRing, formatPrice, manrope, pinkButtonCls, plural } from "@/components/landing/shared";

function lessonCount(course: CourseDTO) {
  return course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
}

function activePlans(course: CourseDTO) {
  // У бесплатного курса тарифы скрыты, пока включён флаг isFree
  if (course.isFree) return [];
  return course.pricingPlans
    .filter((p) => p.isActive)
    .sort((a, b) => a.order - b.order);
}

function minPlan(course: CourseDTO) {
  return activePlans(course).reduce<CourseDTO["pricingPlans"][number] | null>(
    (min, p) => (!min || p.price < min.price ? p : min),
    null,
  );
}

// Авторство стоковых фото с Wikimedia Commons (лицензии CC BY / CC BY-SA
// требуют подписи). Когда замените фото на свои — уберите записи отсюда.
type Credit = { author: string; url: string; license: string };
const CC_BY_2 = "CC BY 2.0";
const CC_BY_SA_4 = "CC BY-SA 4.0";
const LICENSE_URLS: Record<string, string> = {
  [CC_BY_2]: "https://creativecommons.org/licenses/by/2.0/",
  [CC_BY_SA_4]: "https://creativecommons.org/licenses/by-sa/4.0/",
};
const PHOTO_CREDITS: Record<string, Credit> = {
};

const num = (i: number) => `(${String(i + 1).padStart(2, "0")})`;

// Единый видимый фокус для клавиатурной навигации

// ─── Статичный контент лендинга ────────────────────────────────────────────
const BENEFITS = [
  {
    icon: Sparkles,
    title: "Без лишней теории",
    text: "Только то, что работает на практике: форма, хна, краска, колористика",
  },
  {
    icon: Users,
    title: "Новичкам и мастерам",
    text: "Освоите профессию с нуля или прокачаете навыки, если уже работаете",
  },
  {
    icon: TrendingUp,
    title: "Рост чека и клиентов",
    text: "Научитесь поднимать средний чек и находить новых клиентов",
  },
];

// План обучения по дням (текст автора курсов)
const STEPS = [
  {
    days: "1–7 день",
    format: "онлайн",
    title: "Онлайн-подготовка",
    points: [
      "Уроки на сайте: мои показы на моделях и вся теория по перманенту",
      "Материалы остаются с вами и после обучения",
      "Домашнее задание",
    ],
  },
  {
    days: "8 день",
    format: "очно",
    title: "Знакомство и постановка руки",
    points: [
      "Разбираем пройденный материал",
      "Ставим руку и тренируем штрихи на латексе",
      "Строим эскиз на манекене",
    ],
  },
  {
    days: "9 день",
    format: "очно",
    title: "Мой показ на модели",
    points: [
      "Показываю работу на модели — брови или губы на выбор",
      "Вы работаете с моделью на зоне бровей",
    ],
  },
  {
    days: "10 день",
    format: "очно",
    title: "Практика и сертификат",
    points: ["Две модели: зона бровей и зона губ", "Вручение сертификата"],
  },
];

// ─── UI-кирпичики ───────────────────────────────────────────────────────────

/** Плавное появление блока при прокрутке. Учитывает prefers-reduced-motion. */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  top,
  accent,
  lead,
  dark = false,
  compact = false,
}: {
  top: string;
  accent: string;
  lead?: string;
  dark?: boolean;
  compact?: boolean;
}) {
  return (
    <Reveal className={`${compact ? "mb-6 md:mb-10" : "mb-10 md:mb-14"} max-w-3xl`}>
      <h2
        className={`${compact ? "text-2xl md:text-4xl" : "text-3xl md:text-5xl"} font-extrabold uppercase tracking-tight leading-[1.05] ${
          dark ? "text-white" : "text-landing-plum"
        }`}
      >
        {top}
        <br />
        <span className="text-landing-pink">{accent}</span>
      </h2>
      {lead && (
        <p
          className={`mt-4 text-base md:text-lg ${
            dark ? "text-white/80" : "text-landing-plum/80"
          }`}
        >
          {lead}
        </p>
      )}
    </Reveal>
  );
}

function PinkButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${pinkButtonCls} ${className}`}
    >
      {children}
    </Link>
  );
}

function PhotoCredits({ srcs }: { srcs: (string | null | undefined)[] }) {
  const seen = new Set<string>();
  const credits = srcs
    .map((src) => (src ? PHOTO_CREDITS[src] : undefined))
    .filter((c): c is Credit => {
      if (!c || seen.has(c.url)) return false;
      seen.add(c.url);
      return true;
    });
  if (credits.length === 0) return null;
  return (
    <p className="mt-6 text-xs text-landing-plum/60">
      Фото:{" "}
      {credits.map((c, i) => (
        <span key={c.url}>
          {i > 0 && ", "}
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-landing-pink"
          >
            {c.author}
          </a>{" "}
          (
          <a
            href={LICENSE_URLS[c.license]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-landing-pink"
          >
            {c.license}
          </a>
          )
        </span>
      ))}
    </p>
  );
}

/** Горизонтальная карусель работ: свайп на мобильных, стрелки на десктопе. */
/** Галерея «Мои работы»: сетка + просмотр на весь экран (стрелки, свайп, Esc). */
function AuthorGallery({ photos }: { photos: WorkPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const LIMIT = 8;
  const visible = showAll ? photos : photos.slice(0, LIMIT);

  const go = (d: number) =>
    setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length));

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open === null]);

  const current = open === null ? null : photos[open];

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {visible.map((p, i) => (
          <li key={p.src} className={i === 0 ? "col-span-2 row-span-2" : ""}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className={`group relative block aspect-square w-full overflow-hidden rounded-2xl bg-landing-blush md:rounded-3xl ${focusRing}`}
              aria-label={`Открыть фото ${i + 1}${p.alt ? `: ${p.alt}` : ""}`}
            >
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
              />
              {p.alt && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-landing-plum/80 to-transparent p-3 pt-8 text-left text-xs md:text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {p.alt}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {photos.length > LIMIT && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className={`inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-landing-plum/20 px-7 text-sm font-bold uppercase tracking-wide transition-colors hover:border-landing-pink hover:text-landing-pink ${focusRing}`}
          >
            {showAll ? "Свернуть" : `Показать все · ${photos.length}`}
          </button>
        </div>
      )}

      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-landing-plum/95 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фото"
          onClick={() => setOpen(null)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={current.src}
              alt={current.alt}
              className="max-h-[80vh] w-auto rounded-2xl object-contain"
            />
            <figcaption className="mt-3 text-center text-sm text-white/85">
              {current.alt && <span className="font-semibold text-white">{current.alt} · </span>}
              {open! + 1} из {photos.length}
            </figcaption>
          </figure>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Закрыть"
            className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          >
            <X className="h-6 w-6" />
          </button>
          {photos.length > 1 &&
            ([-1, 1] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(d);
                }}
                aria-label={d < 0 ? "Предыдущее фото" : "Следующее фото"}
                className={`absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 sm:flex ${
                  d < 0 ? "left-4" : "right-4"
                }`}
              >
                {d < 0 ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
              </button>
            ))}
        </div>
      )}
    </>
  );
}

function WorksCarousel({ works }: { works: WorkPhoto[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const arrow = (dir: 1 | -1, enabled: boolean) => (
    <button
      type="button"
      onClick={() => scrollBy(dir)}
      disabled={!enabled}
      aria-label={dir === 1 ? "Следующие работы" : "Предыдущие работы"}
      className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-landing-pink shadow-md ring-1 ring-landing-plum/10 transition-all hover:bg-landing-pink hover:text-white disabled:pointer-events-none disabled:opacity-30 md:flex ${focusRing}`}
    >
      {dir === 1 ? (
        <ChevronRight className="h-6 w-6" aria-hidden />
      ) : (
        <ChevronLeft className="h-6 w-6" aria-hidden />
      )}
    </button>
  );

  return (
    <div className="rounded-[28px] bg-white p-4 ring-1 ring-landing-plum/10 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm md:text-base font-extrabold uppercase tracking-widest">
          Галерея работ
        </p>
        <div className="flex gap-2">
          {arrow(-1, canPrev)}
          {arrow(1, canNext)}
        </div>
      </div>
      <div
        ref={trackRef}
        onScroll={updateArrows}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] md:-mx-6 md:scroll-px-6 md:px-6 [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-label="Галерея работ учениц"
        tabIndex={0}
      >
        {works.map((w) => (
          <img
            key={w.src}
            src={w.src}
            alt={w.alt}
            loading="lazy"
            className="aspect-[4/3] w-[80%] shrink-0 snap-start rounded-2xl object-cover sm:w-[45%] lg:w-[calc((100%-2rem)/3)]"
          />
        ))}
      </div>
    </div>
  );
}

function CourseCard({ course, index }: { course: CourseDTO; index: number }) {
  const plans = activePlans(course);
  const cheapest = minPlan(course);
  const lessons = lessonCount(course);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_20px_50px_-25px_rgba(86,62,79,0.35)] ring-1 ring-landing-plum/5 transition-shadow hover:shadow-[0_30px_60px_-25px_rgba(86,62,79,0.45)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-landing-blush via-white to-pink-100">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Gem className="h-16 w-16 text-landing-pink/60" aria-hidden />
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-landing-pink shadow-sm">
          {course.isFree ? "бесплатно" : "онлайн"}
        </span>
        <span className="absolute right-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-landing-plum">
          {num(index)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6 md:p-7">
        <h3 className="mb-3 text-xl md:text-2xl font-extrabold uppercase leading-tight text-landing-plum">
          {course.title}
        </h3>
        <p className="mb-5 line-clamp-3 text-sm md:text-base text-landing-plum/80">
          {course.description}
        </p>

        <div className="mb-5 flex flex-wrap gap-2 text-xs font-semibold text-landing-plum">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-landing-blush px-3 py-1.5">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            {course.modules.length}{" "}
            {plural(course.modules.length, "модуль", "модуля", "модулей")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-landing-blush px-3 py-1.5">
            <Video className="h-3.5 w-3.5" aria-hidden />
            {lessons} {plural(lessons, "урок", "урока", "уроков")}
          </span>
        </div>

        {plans.length > 0 && (
          <ul className="mb-6 space-y-2" aria-label="Тарифы">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm ${
                  plan.isRecommended
                    ? "bg-landing-blush ring-2 ring-landing-pink"
                    : "bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2 font-semibold text-landing-plum">
                  {plan.name}
                  {plan.isRecommended && (
                    <span className="rounded-full bg-landing-pink px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      популярный
                    </span>
                  )}
                </span>
                <span className="whitespace-nowrap font-bold text-landing-plum">
                  {formatPrice(plan.price, plan.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto">
          {course.isFree ? (
            <p className="mb-4 text-2xl font-extrabold text-landing-pink">Бесплатно</p>
          ) : (
            cheapest && (
              <p className="mb-4 text-sm text-landing-plum/80">
                от{" "}
                <span className="text-2xl font-extrabold text-landing-pink">
                  {formatPrice(cheapest.price, cheapest.currency)}
                </span>
              </p>
            )
          )}
          <PinkButton href={`/course/${course.id}`} className="w-full">
            {course.isFree
              ? "Начать бесплатно"
              : cheapest
                ? "Выбрать тариф"
                : "Подробнее о курсе"}{" "}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </PinkButton>
        </div>
      </div>
    </article>
  );
}

function FaqItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  const id = useId();
  return (
    <div className="border-b border-landing-plum/15">
      <h3>
        <button
          id={`${id}-q`}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${id}-a`}
          className={`flex w-full min-h-[64px] items-center justify-between gap-4 rounded-xl py-5 text-left transition-colors hover:text-landing-pink ${focusRing}`}
        >
          <span className="text-base md:text-xl font-bold">{q}</span>
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
              open
                ? "rotate-180 bg-landing-pink text-white"
                : "bg-landing-blush text-landing-pink"
            }`}
            aria-hidden
          >
            <ChevronDown className="h-5 w-5" />
          </span>
        </button>
      </h3>
      <div
        id={`${id}-a`}
        role="region"
        aria-labelledby={`${id}-q`}
        className={`grid transition-all duration-300 motion-reduce:transition-none ${
          open ? "grid-rows-[1fr] pb-6 opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <p className="overflow-hidden text-sm md:text-base text-landing-plum/80">
          {a}
        </p>
      </div>
    </div>
  );
}

// ─── Страница ───────────────────────────────────────────────────────────────

export default function WelcomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { courses, isLoading } = useCourses();
  const [openFaq, setOpenFaq] = useState(0);
  // Контент, который автор редактирует в админке (Админка → Главная)
  // Черновик из окна предпросмотра админки важнее сохранённого контента
  const saved = useLandingContent();
  const draft = usePreviewDraft<LandingContentData>("landing");
  const content = draft ?? saved;
  const author = hasSection(content, "author") ? content : null;

  // В предпросмотре прокручиваем к разделу, который редактируют (#my-works и т.п.)
  const scrolledToHash = useRef(false);
  useEffect(() => {
    if (!draft || scrolledToHash.current || !window.location.hash) return;
    scrolledToHash.current = true;
    requestAnimationFrame(() =>
      document.querySelector(window.location.hash)?.scrollIntoView({ block: "start" }),
    );
  }, [draft]);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const coursesRef = useRef<HTMLElement>(null);

  // Все опубликованные курсы с программой: платные, бесплатные и без тарифов
  // + черновик нового курса из предпросмотра админки (у него ещё нет разделов)
  const saleCourses = courses.filter(
    (c) => c.modules.length > 0 || c.id === PREVIEW_DRAFT_COURSE_ID,
  );
  const featured = saleCourses[0];
  const featuredMin = featured ? minPlan(featured) : null;

  useEffect(() => {
    // Внутри предпросмотра админки показываем главную как гостю
    if (isAuthenticated && !isPreviewFrame()) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Мобильная плавающая кнопка: видна, когда hero ушёл за экран,
  // и прячется, пока на экране сам блок с ценами — чтобы не дублировать CTA.
  useEffect(() => {
    const hero = heroRef.current;
    const pricing = coursesRef.current;
    if (!hero || !pricing || typeof IntersectionObserver === "undefined") return;
    const state = { heroVisible: true, pricingVisible: false };
    const update = () =>
      setShowStickyCta(!state.heroVisible && !state.pricingVisible);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) state.heroVisible = e.isIntersecting;
        if (e.target === pricing) state.pricingVisible = e.isIntersecting;
      }
      update();
    });
    io.observe(hero);
    io.observe(pricing);
    return () => io.disconnect();
  }, [isAuthenticated]);

  if (isAuthenticated && !isPreviewFrame()) {
    return null;
  }


  return (
    <>
      <Header />
      <main className={`${manrope.className} w-full bg-white text-landing-plum`}>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative overflow-hidden bg-gradient-to-b from-landing-blush to-white"
        >
          <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-landing-pink/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />

          <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-14 text-center md:px-6 md:pb-24 md:pt-24 lg:px-8">
            <div className="animate-fade-in motion-reduce:animate-none">
              <h1 className="mb-6 text-[2.6rem] leading-[0.95] md:text-7xl lg:text-[5.5rem] font-extrabold uppercase tracking-tight text-landing-plum">
                Курсы
                <br />
                <span className="text-landing-pink">по бровям</span>
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-base md:text-xl text-landing-plum/80">
                Натуральные брови хной и краской, колористика и перманент — от
                первой клиентки до высокого чека. Учитесь в своём темпе и
                получите сертификат.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <PinkButton href="#courses">
                  Выбрать курс <ArrowRight className="h-4 w-4" aria-hidden />
                </PinkButton>
                <Link
                  href="#how"
                  className={`inline-flex min-h-[52px] items-center justify-center rounded-full border-2 border-landing-plum/20 bg-white/60 px-8 py-4 text-sm md:text-base font-bold uppercase tracking-wide text-landing-plum transition-colors hover:border-landing-pink hover:text-landing-pink ${focusRing}`}
                >
                  Как проходит обучение
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* ── Об авторе ────────────────────────────────────────── */}
        {author && (
          <section id="author" className="scroll-mt-20 overflow-hidden px-4 py-12 md:px-6 md:py-20 lg:px-8">
            <div
              className={`mx-auto grid max-w-7xl items-center gap-10 md:gap-14 ${
                author.authorPhoto ? "lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" : ""
              }`}
            >
              {author.authorPhoto && (
                <Reveal>
                  <div className="relative mx-auto max-w-2xl lg:max-w-none">
                    {/* Фото автора горизонтальное — показываем 4:3, без обрезки лица */}
                    <img
                      src={author.authorPhoto}
                      alt={author.authorName || "Автор курсов"}
                      loading="lazy"
                      className="aspect-[4/3] w-full rounded-[32px] object-cover object-[40%_35%] shadow-[0_30px_70px_-30px_rgba(86,62,79,0.6)] ring-1 ring-landing-plum/5"
                    />
                  </div>
                </Reveal>
              )}
              <Reveal delay={100}>
                {author.authorName ? (
                  <>
                    <p className="mb-3 text-xs md:text-sm font-extrabold uppercase tracking-widest text-landing-pink">
                      Об авторе курсов
                    </p>
                    <h2 className="text-3xl md:text-5xl font-extrabold uppercase leading-[1.05] tracking-tight">
                      {author.authorName}
                    </h2>
                  </>
                ) : (
                  <h2 className="text-3xl md:text-5xl font-extrabold uppercase leading-[1.05] tracking-tight">
                    Об авторе <span className="text-landing-pink">курсов</span>
                  </h2>
                )}
                {author.authorRole && (
                  <p className="mt-3 text-base md:text-lg font-semibold text-landing-plum/70">
                    {author.authorRole}
                  </p>
                )}
                {author.authorBio && (
                  <p className="mt-6 whitespace-pre-line text-base md:text-lg text-landing-plum/80">
                    {author.authorBio}
                  </p>
                )}
                {author.authorFacts.length > 0 && (
                  <dl
                    className={`mt-8 grid gap-3 ${author.authorFacts.length > 1 ? "sm:grid-cols-2" : ""}`}
                  >
                    {author.authorFacts.map((f, i) => (
                      <div key={i} className="rounded-3xl bg-landing-blush p-5 md:p-6">
                        {f.title && (
                          <dt className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-landing-pink">
                            {f.title}
                          </dt>
                        )}
                        <dd className="mt-1.5 whitespace-pre-line text-base font-semibold leading-snug">
                          {f.text}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {hasSection(content, "my-works") && (
                  <a
                    href="#my-works"
                    className={`mt-8 inline-flex items-center gap-2 rounded text-sm md:text-base font-bold uppercase tracking-wide text-landing-pink hover:underline ${focusRing}`}
                  >
                    Смотреть мои работы <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                )}
              </Reveal>
            </div>
          </section>
        )}

        {/* ── Мои работы (портфолио автора) ────────────────────── */}
        {content && content.authorWorks.length > 0 && (
          <section id="my-works" className="scroll-mt-20 px-4 pb-12 md:px-6 md:pb-20 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <SectionTitle compact top="Мои" accent="работы" />
              <Reveal>
                <AuthorGallery photos={content.authorWorks} />
              </Reveal>
            </div>
          </section>
        )}

        {/* ── Кому подойдёт ────────────────────────────────────── */}
        <section id="for-whom" className="scroll-mt-20 px-4 py-12 md:px-6 md:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionTitle compact top="Почему" accent="наши курсы" />
            <Reveal>
              <ul className="grid divide-y divide-landing-pink/15 rounded-[28px] bg-landing-blush px-5 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-0 md:py-8">
                {BENEFITS.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-4 py-5 md:flex-col md:gap-4 md:px-8 md:py-0">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-landing-pink shadow-[0_8px_20px_-8px_rgba(245,73,160,0.8)]">
                      <Icon className="h-5 w-5 text-white" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-base md:text-lg font-extrabold leading-snug">{title}</h3>
                      <p className="mt-1 text-sm md:text-base text-landing-plum/75">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ── Как проходит обучение ────────────────────────────── */}
        <section id="how" className="scroll-mt-20 px-4 pb-12 md:px-6 md:pb-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              compact
              top="Как проходит"
              accent="обучение"
              lead="10 дней: неделя онлайн-подготовки и 3 дня практики на моделях"
            />
            <Reveal>
              {/* Таймлайн: вертикальный на телефоне, горизонтальный на десктопе */}
              <ol className="grid gap-8 md:grid-cols-2 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
                {STEPS.map(({ days, format, title, points }, i) => {
                  const last = i === STEPS.length - 1;
                  return (
                    <li key={days} className="relative flex gap-4 lg:flex-col lg:gap-5">
                      {/* Линия к следующему шагу */}
                      {!last && (
                        <span
                          className="absolute left-5 top-12 -bottom-8 w-0.5 -translate-x-1/2 bg-landing-pink/40 md:hidden lg:block lg:left-12 lg:-right-6 lg:top-5 lg:bottom-auto lg:h-0.5 lg:w-auto lg:translate-x-0"
                          aria-hidden
                        />
                      )}
                      <span
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white ring-4 ring-white ${
                          last ? "bg-landing-pink" : "bg-landing-plum"
                        }`}
                        aria-hidden
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold uppercase tracking-wider text-landing-pink">
                            {days}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              format === "онлайн"
                                ? "bg-landing-blush text-landing-pink"
                                : "bg-landing-plum/10 text-landing-plum"
                            }`}
                          >
                            {format}
                          </span>
                        </p>
                        <h3 className="mt-2 text-lg font-extrabold leading-snug">{title}</h3>
                        <ul className="mt-3 space-y-2">
                          {points.map((pt) => (
                            <li key={pt} className="flex gap-2 text-sm md:text-base text-landing-plum/80">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-landing-pink" aria-hidden />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* ── Работы учениц ────────────────────────────────────── */}
        {content && (content.works.length > 0 || content.results.length > 0) && (
        <section
          id="results"
          className="scroll-mt-20 bg-landing-cream px-4 py-16 md:px-6 md:py-24 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <SectionTitle top="Работы учениц" accent="до и после курса" />

            {content.works.length > 0 && (
              <Reveal className="mb-6">
                <WorksCarousel works={content.works} />
              </Reveal>
            )}

            <div className="space-y-6">
              {content.results.map((r, i) => (
                <Reveal key={i}>
                  <article className="grid overflow-hidden rounded-[28px] bg-white ring-1 ring-landing-plum/10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                    <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[320px]">
                      <img
                        src={r.photo}
                        alt={r.tag ? `Работа ученицы: ${r.tag.toLowerCase()}` : "Работа ученицы"}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-6 md:p-10">
                      <div className="mb-6 flex items-center justify-between gap-4">
                        <h3 className="text-xl md:text-2xl font-extrabold uppercase">
                          {r.tag}
                        </h3>
                        <span className="text-sm font-bold text-landing-plum/60">{num(i)}</span>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-landing-plum/70">
                            До:
                          </p>
                          <ul className="space-y-2 text-sm md:text-base text-landing-plum/80">
                            {r.before.map((b) => (
                              <li key={b} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-landing-plum/40" aria-hidden />
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-2xl bg-landing-blush p-5">
                          <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-landing-pink">
                            После:
                          </p>
                          <ul className="space-y-2 text-sm md:text-base font-semibold">
                            {r.after.map((a) => (
                              <li key={a} className="flex gap-2">
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-landing-pink" aria-hidden />
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>

          </div>
        </section>
        )}

        {/* ── Отзывы ───────────────────────────────────────────── */}
        {content && content.reviews.length > 0 && (
        <section
          id="reviews"
          className="scroll-mt-20 bg-landing-plum px-4 py-16 md:px-6 md:py-24 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <SectionTitle top="Что говорят" accent="наши ученицы" dark />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.reviews.map((r, i) => (
                <Reveal key={i} delay={(i % 3) * 100}>
                  <figure className="flex h-full flex-col justify-between rounded-[28px] bg-white/5 p-7 ring-1 ring-white/10 transition-colors hover:bg-white/10">
                    <blockquote className="mb-6 text-lg md:text-xl font-bold leading-snug text-white">
                      «{r.text}»
                    </blockquote>
                    <figcaption className="text-sm font-bold text-landing-pink">
                      {r.name || num(i)}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* ── Цены на курсы ────────────────────────────────────── */}
        <section
          id="courses"
          ref={coursesRef}
          className="scroll-mt-20 bg-landing-cream px-4 py-16 md:px-6 md:py-24 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              top="Цены"
              accent="на курсы"
              lead="Выберите программу и тариф — доступ откроется сразу после оплаты."
            />
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-[520px] animate-pulse rounded-[28px] bg-white ring-1 ring-landing-plum/5"
                  />
                ))}
              </div>
            ) : saleCourses.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {saleCourses.map((course, i) => (
                  <Reveal key={course.id} delay={i * 100}>
                    <CourseCard course={course} index={i} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <p className="text-landing-plum/80">
                Курсы скоро появятся — следите за обновлениями.
              </p>
            )}
            <PhotoCredits srcs={saleCourses.map((c) => c.thumbnailUrl)} />
            <div className="mt-10">
              <Link
                href="/courses"
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-full font-bold uppercase tracking-wide text-landing-pink hover:underline ${focusRing}`}
              >
                Весь каталог <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        {content && content.faq.length > 0 && (
        <section id="faq" className="scroll-mt-20 px-4 py-16 md:px-6 md:py-24 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_1.5fr] lg:gap-10">
            <SectionTitle
              top="Вопрос /"
              accent="ответ"
              lead="Не нашли ответ? Напишите нам — контакты внизу страницы."
            />
            <div>
              {content.faq.map((item, i) => (
                <FaqItem
                  key={i}
                  {...item}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
                />
              ))}
            </div>
          </div>
        </section>
        )}

        {/* ── Финальный CTA ────────────────────────────────────── */}
        <section className="px-4 pb-16 md:px-6 md:pb-24 lg:px-8">
          <Reveal>
            <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[40px] bg-gradient-to-br from-landing-pink to-pink-400 px-6 py-14 text-center md:px-12 md:py-20">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
              <h2 className="relative mb-4 text-3xl md:text-5xl font-extrabold uppercase leading-tight text-white">
                Готовы начать?
              </h2>
              <p className="relative mx-auto mb-8 max-w-xl text-base md:text-lg text-white">
                Зарегистрируйтесь и начните обучение уже сегодня
              </p>
              <Link
                href="/auth/register"
                className={`relative inline-flex min-h-[52px] items-center gap-2 rounded-full bg-white px-8 py-4 text-sm md:text-base font-bold uppercase tracking-wide text-landing-pink transition-transform hover:-translate-y-0.5 active:scale-95 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60`}
              >
                Зарегистрироваться <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <div className={manrope.className}>
        <LandingFooter />
      </div>
      {/* Отступ, чтобы плавающая кнопка не перекрывала низ футера на мобильных */}
      <div className="h-24 bg-landing-pink-dark md:hidden" aria-hidden />

      {/* ── Плавающая CTA-кнопка (только мобильные) ──────────── */}
      <div
        className={`${manrope.className} fixed inset-x-0 bottom-0 z-30 border-t border-landing-plum/10 bg-white/95 p-3 backdrop-blur transition-all duration-300 md:hidden ${
          showStickyCta ? "visible translate-y-0" : "invisible translate-y-full"
        }`}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <PinkButton href="#courses" className="w-full">
          {featuredMin
            ? `Выбрать курс · от ${formatPrice(featuredMin.price, featuredMin.currency)}`
            : "Выбрать курс"}
        </PinkButton>
      </div>
    </>
  );
}
