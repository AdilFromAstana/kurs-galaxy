"use client";

import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCourses, type CourseDTO } from "@/components/providers/CoursesProvider";
import type { BlockId, LandingContentData, LandingTexts, ResultCard, Step, WorkPhoto } from "@/lib/landingContentShared";
import { COURSE_TABS, hasSection, useLandingContent, type CourseTab } from "@/hooks/useLandingContent";
import { PREVIEW_DRAFT_COURSE_ID, isPreviewFrame, usePreviewDraft } from "@/lib/preview";
import Header from "@/components/layout/Header";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
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



const num = (i: number) => `(${String(i + 1).padStart(2, "0")})`;

// Единый видимый фокус для клавиатурной навигации

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

/** Подпись для незрячих и поисковиков, если автор не подписал фото в админке. */
function photoAlt(p: WorkPhoto, i: number, who: string) {
  return p.alt || `${who}: до и после, фото ${i + 1}`;
}

/** Просмотр фото на весь экран: стрелки, свайп, Esc, счётчик. Общий для всех галерей. */
function Lightbox({
  photos,
  index,
  who,
  onIndex,
  onClose,
}: {
  photos: WorkPhoto[];
  index: number | null;
  who: string;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null;
  const go = (d: number) => index !== null && onIndex((index + d + photos.length) % photos.length);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    // Возвращаем фокус туда, откуда открыли — клавиатурой не теряем место на странице
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index]);

  if (index === null) return null;
  const current = photos[index];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-landing-plum/95 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фото"
      onClick={onClose}
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
          alt={photoAlt(current, index, who)}
          className="max-h-[80vh] w-auto rounded-2xl object-contain"
        />
        <figcaption className="mt-3 text-center text-sm text-white/85">
          {current.alt && <span className="font-semibold text-white">{current.alt} · </span>}
          {index + 1} из {photos.length}
        </figcaption>
      </figure>
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
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
  );
}

/** Галерея «Мои работы»: сетка, первое фото крупно, по нажатию — на весь экран. */
function AuthorGallery({ photos }: { photos: WorkPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const LIMIT = 8;
  const visible = showAll ? photos : photos.slice(0, LIMIT);
  const who = "Работа мастера";

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {visible.map((p, i) => (
          <li key={p.src} className={i === 0 ? "col-span-2 row-span-2" : ""}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className={`group relative block aspect-square w-full overflow-hidden rounded-2xl bg-landing-blush md:rounded-3xl ${focusRing}`}
              aria-label={`Открыть фото ${i + 1} из ${photos.length}${p.alt ? `: ${p.alt}` : ""}`}
            >
              <img
                src={p.src}
                alt={photoAlt(p, i, who)}
                loading="lazy"
                decoding="async"
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
      <Lightbox photos={photos} index={open} who={who} onIndex={setOpen} onClose={() => setOpen(null)} />
    </>
  );
}

/** Карусель «Работы учениц»: свайп на телефоне, стрелки на десктопе, по нажатию — на весь экран. */
function WorksCarousel({ works }: { works: WorkPhoto[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [open, setOpen] = useState<number | null>(null);
  const who = "Работа ученицы";

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
        <p className="text-sm text-landing-plum/70">
          {works.length} {plural(works.length, "работа", "работы", "работ")} · нажмите, чтобы увеличить
        </p>
        <div className="flex gap-2">
          {arrow(-1, canPrev)}
          {arrow(1, canNext)}
        </div>
      </div>
      <ul
        ref={trackRef}
        onScroll={updateArrows}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] md:-mx-6 md:scroll-px-6 md:px-6 [&::-webkit-scrollbar]:hidden"
        aria-label="Галерея работ учениц"
      >
        {works.map((w, i) => (
          <li key={w.src} className="w-[80%] shrink-0 snap-start sm:w-[45%] lg:w-[calc((100%-2rem)/3)]">
            <button
              type="button"
              onClick={() => setOpen(i)}
              className={`group block w-full overflow-hidden rounded-2xl ${focusRing}`}
              aria-label={`Открыть работу ${i + 1} из ${works.length}${w.alt ? `: ${w.alt}` : ""}`}
            >
              <img
                src={w.src}
                alt={photoAlt(w, i, who)}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
              />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox photos={works} index={open} who={who} onIndex={setOpen} onClose={() => setOpen(null)} />
    </div>
  );
}

/** План обучения перманенту по дням: вертикально на телефоне, в ряд на десктопе. */
function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="grid gap-8 md:grid-cols-2 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
      {steps.map(({ days, format, title, points }, i) => {
        const last = i === steps.length - 1;
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
  );
}

/** Разделы курса — «что входит в обучение» перед ценой. */
/**
 * Название раздела для списка: номер уже в кружке, поэтому «Урок 3. РАЗМЕТКА» → «РАЗМЕТКА»;
 * «ДО|ПОСЛЕ» → «ДО / ПОСЛЕ» (вертикальная черта в этом шрифте похожа на «І»).
 */
function moduleTitle(title: string) {
  const t = title.replace(/^\s*(урок|раздел|модуль)\s*\d+\s*[.:)—-]?\s*/i, "").replace(/\s*\|\s*/g, " / ").trim();
  return t || title;
}

function ModulesList({ course }: { course: CourseDTO }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {course.modules.map((m, i) => (
        <li
          key={m.id}
          className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-landing-plum/10"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-landing-blush text-sm font-extrabold text-landing-pink"
            aria-hidden
          >
            {i + 1}
          </span>
          <span className="text-sm md:text-base font-bold leading-snug">{moduleTitle(m.title)}</span>
        </li>
      ))}
    </ol>
  );
}

/** Карточки «до / после» с описанием (Админка → Результаты). */
function ResultCards({ results }: { results: ResultCard[] }) {
  return (
    <div className="space-y-6">
      {results.map((r, i) => (
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
                <h3 className="text-xl md:text-2xl font-extrabold uppercase">{r.tag}</h3>
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
  );
}

/** Блок вкладки курса: заголовок + содержимое. Пустые блоки не рендерим снаружи. */
function TabBlock({ top, accent, lead, children }: { top: string; accent: string; lead?: string; children: ReactNode }) {
  return (
    <div className="py-10 md:py-14">
      <SectionTitle compact top={top} accent={accent} lead={lead} />
      <Reveal>{children}</Reveal>
    </div>
  );
}

/** Карточка цены: крупная цена, пояснение и кнопка. */
function PriceCard({
  children,
  note,
  action,
}: {
  children: ReactNode;
  note?: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-landing-pink to-pink-400 p-6 text-white md:p-10">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
      <div className="relative md:flex md:items-end md:justify-between md:gap-10">
        <div>
          {children}
          {note && <div className="mt-3 max-w-xl whitespace-pre-line text-base text-white/90">{note}</div>}
        </div>
        <div className="mt-6 shrink-0 md:mt-0">{action}</div>
      </div>
    </div>
  );
}

const whiteButtonCls = `inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm md:text-base font-bold uppercase tracking-wide text-landing-pink transition-transform hover:-translate-y-0.5 active:scale-95 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 md:w-auto`;

/** Главное действие вкладки — одно и то же в карточке цены и в плавающей кнопке на телефоне. */
type Cta = { href: string; label: string; short: string; external?: boolean; whatsapp?: boolean };

function browCta(course: CourseDTO | undefined, fallbackPrice: string, t: LandingTexts): Cta {
  const href = course ? `/course/${course.id}` : "/courses";
  if (course?.isFree) return { href, label: "Начать бесплатно", short: "Начать бесплатно" };
  const plans = course ? activePlans(course) : [];
  const min = plans.reduce<(typeof plans)[number] | null>((m, p) => (!m || p.price < m.price ? p : m), null);
  const price = min ? `${plans.length > 1 ? "от " : ""}${formatPrice(min.price, min.currency)}` : fallbackPrice;
  return { href, label: t.browBuy, short: price ? `Купить · ${price}` : "Купить курс" };
}

function permanentCta(whatsapp: string, t: LandingTexts): Cta {
  if (!whatsapp) return { href: "#contacts", label: "Оставить заявку", short: "Записаться на обучение" };
  const text = encodeURIComponent(t.permanentGreeting);
  return {
    href: `https://wa.me/${whatsapp}?text=${text}`,
    label: t.permanentButton,
    short: "Записаться в WhatsApp",
    external: true,
    whatsapp: true,
  };
}

function CtaLink({ cta, className, short = false }: { cta: Cta; className: string; short?: boolean }) {
  const inner = (
    <>
      {cta.whatsapp && <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />}
      {short ? cta.short : cta.label}
      {!cta.whatsapp && <ArrowRight className="h-4 w-4" aria-hidden />}
    </>
  );
  if (cta.external)
    return (
      <a href={cta.href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  if (cta.href.startsWith("#"))
    return (
      <a href={cta.href} className={className}>
        {inner}
      </a>
    );
  return (
    <Link href={cta.href} className={className}>
      {inner}
    </Link>
  );
}

/** Цена курса «Бровист с 0»: тарифы курса, а если их нет — цена из админки. */
function BrowPrice({ course, fallback, t }: { course: CourseDTO | undefined; fallback: string; t: LandingTexts }) {
  const plans = course ? activePlans(course) : [];
  const action = <CtaLink cta={browCta(course, fallback, t)} className={whiteButtonCls} />;

  if (course?.isFree) {
    return (
      <PriceCard action={action}>
        <p className="text-4xl md:text-6xl font-extrabold">Бесплатно</p>
      </PriceCard>
    );
  }
  if (plans.length > 1) {
    return (
      <PriceCard
        action={action}
        note={t.browPriceNote}
      >
        <ul className="space-y-2" aria-label="Тарифы">
          {plans.map((p) => (
            <li key={p.id} className="flex flex-wrap items-baseline gap-x-3">
              <span className="text-3xl md:text-5xl font-extrabold">{formatPrice(p.price, p.currency)}</span>
              <span className="text-base font-bold uppercase text-white/90">{p.name}</span>
            </li>
          ))}
        </ul>
      </PriceCard>
    );
  }
  const price = plans[0] ? formatPrice(plans[0].price, plans[0].currency) : fallback;
  return (
    <PriceCard action={action} note={t.browPriceNote}>
      {price ? (
        <p className="text-4xl md:text-6xl font-extrabold">{price}</p>
      ) : (
        <p className="text-2xl md:text-3xl font-extrabold">Цена — на странице курса</p>
      )}
    </PriceCard>
  );
}

/** Цена обучения перманенту и кнопка записи в WhatsApp. */
function PermanentPrice({ price, note, whatsapp, t }: { price: string; note: string; whatsapp: string; t: LandingTexts }) {
  const action = <CtaLink cta={permanentCta(whatsapp, t)} className={whiteButtonCls} />;
  return (
    <PriceCard action={action} note={note || undefined}>
      <p className="text-sm font-extrabold uppercase tracking-widest text-white/80">{t.permanentPriceLabel}</p>
      <p className="mt-1 text-4xl md:text-6xl font-extrabold">{price || t.permanentNoPrice}</p>
    </PriceCard>
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
// Сверху — автор, под ним две вкладки-курса (как на схеме автора):
//   «Бровист с 0»: мои работы → работы учениц → разделы курса → цена и покупка;
//   «Натуральный перманент»: как проходит обучение → мои работы → работы учениц
//   → цена обучения → запись в WhatsApp.

export default function WelcomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { courses, isLoading } = useCourses();
  const [openFaq, setOpenFaq] = useState(0);
  const [tab, setTab] = useState<CourseTab>("brow");
  const tabsRef = useRef<HTMLElement>(null);
  // Контент, который автор редактирует в админке (Админка → Главная)
  // Черновик из окна предпросмотра админки важнее сохранённого контента
  const saved = useLandingContent();
  const draft = usePreviewDraft<LandingContentData>("landing");
  const content = draft ?? saved;
  const author = hasSection(content, "author") ? content : null;

  // Курс вкладки «Бровист»: выбранный в админке; иначе — по слову «бров» в названии;
  // иначе первый курс с программой
  const saleCourses = courses.filter(
    (c) => c.modules.length > 0 || c.id === PREVIEW_DRAFT_COURSE_ID,
  );
  const chosenId = content?.layout.browCourseId;
  const browCourse =
    (chosenId ? courses.find((c) => c.id === chosenId) : undefined) ??
    saleCourses.find((c) => /бров/i.test(c.title)) ??
    saleCourses[0];

  // /#brow и /#permanent (меню, футер, предпросмотр админки) открывают вкладку
  // и прокручивают к ней. Ждём контент — иначе блоки выше ещё не отрисованы.
  const loaded = content !== null;
  useEffect(() => {
    if (!loaded) return;
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (id !== "brow" && id !== "permanent") {
        if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
        // Без вкладки в адресе открываем ту, что автор выбрала первой
        else if (content) setTab(content.layout.firstTab);
        return;
      }
      setTab(id);
      requestAnimationFrame(() =>
        tabsRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }),
      );
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [loaded]);

  const pickTab = (id: CourseTab, focus = false) => {
    setTab(id);
    // Вкладка в адресе — ссылкой можно поделиться, «назад» не засоряем
    window.history.replaceState(null, "", `#${id}`);
    if (focus) document.getElementById(`tab-${id}`)?.focus();
    // Новая вкладка начинается с начала, а не с середины чужого контента
    const top = tabsRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) tabsRef.current?.scrollIntoView({ block: "start" });
  };

  // Стрелки ←/→, Home/End переключают вкладки (WAI-ARIA Tabs)
  const onTabsKey = (e: React.KeyboardEvent) => {
    const ids = COURSE_TABS.map((t) => t.id);
    const i = ids.indexOf(tab);
    const next =
      e.key === "ArrowRight" ? ids[(i + 1) % ids.length]
      : e.key === "ArrowLeft" ? ids[(i - 1 + ids.length) % ids.length]
      : e.key === "Home" ? ids[0]
      : e.key === "End" ? ids[ids.length - 1]
      : null;
    if (!next) return;
    e.preventDefault();
    pickTab(next, true);
  };

  // Плавающая кнопка на телефоне: появляется, когда долистали до курсов,
  // и прячется, пока на экране сама карточка цены — чтобы не дублировать.
  const authorRef = useRef<HTMLElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  useEffect(() => {
    const top = authorRef.current;
    const price = priceRef.current;
    if (!top || typeof IntersectionObserver === "undefined") return;
    const state = { top: true, price: false };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === top) state.top = e.isIntersecting;
        if (e.target === price) state.price = e.isIntersecting;
      }
      setShowStickyCta(!state.top && !state.price);
    });
    io.observe(top);
    if (price) io.observe(price);
    return () => io.disconnect();
  }, [tab, loaded, isLoading]);
  /** Один блок текущей вкладки. Пустые блоки (нет фото, нет разделов) не показываем. */
  // Обычная функция, не компонент: компонент, объявленный внутри страницы, пересоздавался бы
  // на каждой перерисовке (прокрутка меняет плавающую кнопку) и сбрасывал галереи.
  const renderBlock = (id: BlockId) => {
    if (!content) return null;
    const brow = tab === "brow";
    const myWorks = brow ? content.browAuthorWorks : content.authorWorks;
    const studentWorks = brow ? content.browWorks : content.works;
    switch (id) {
      case "facts":
        return content.authorFacts.length > 0 ? (
          <TabBlock top={content.texts.factsTop} accent={content.texts.factsAccent}>
            <dl className={`grid gap-3 ${content.authorFacts.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {content.authorFacts.map((f, i) => (
                <div key={i} className="rounded-3xl bg-landing-blush p-5 md:p-6">
                  {f.title && (
                    <dt className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-landing-pink">
                      {f.title}
                    </dt>
                  )}
                  <dd className="mt-1.5 whitespace-pre-line text-base font-semibold leading-snug">{f.text}</dd>
                </div>
              ))}
            </dl>
          </TabBlock>
        ) : null;
      case "steps":
        return content.steps.length > 0 ? (
          <TabBlock top={content.texts.stepsTop} accent={content.texts.stepsAccent} lead={content.stepsLead || undefined}>
            <Steps steps={content.steps} />
          </TabBlock>
        ) : null;
      case "myWorks":
        return myWorks.length > 0 ? (
          <TabBlock top={content.texts.myWorksTop} accent={content.texts.myWorksAccent}>
            <AuthorGallery photos={myWorks} />
          </TabBlock>
        ) : null;
      case "studentWorks": {
        const results = brow ? [] : content.results;
        return studentWorks.length > 0 || results.length > 0 ? (
          <TabBlock top={content.texts.studentWorksTop} accent={content.texts.studentWorksAccent}>
            {studentWorks.length > 0 && (
              <div className={results.length ? "mb-6" : ""}>
                <WorksCarousel works={studentWorks} />
              </div>
            )}
            {results.length > 0 && <ResultCards results={results} />}
          </TabBlock>
        ) : null;
      }
      case "modules":
        if (isLoading) return <div className="my-10 h-64 animate-pulse rounded-[28px] bg-landing-blush" aria-busy="true" />;
        return browCourse && browCourse.modules.length > 0 ? (
          <TabBlock
            top={content.texts.modulesTop}
            accent={content.texts.modulesAccent}
            lead={`${browCourse.modules.length} ${plural(browCourse.modules.length, "раздел", "раздела", "разделов")} · ${lessonCount(browCourse)} ${plural(lessonCount(browCourse), "урок", "урока", "уроков")} онлайн, в своём темпе`}
          >
            <ModulesList course={browCourse} />
          </TabBlock>
        ) : null;
      case "price":
        if (brow && isLoading) return null;
        return (
          <Reveal className="py-6 md:py-8">
            <div ref={priceRef}>
              {brow ? (
                <BrowPrice course={browCourse} fallback={content.browPrice} t={content.texts} />
              ) : (
                <PermanentPrice price={content.permanentPrice} note={content.permanentNote} whatsapp={content.whatsapp} t={content.texts} />
              )}
            </div>
          </Reveal>
        );
    }
  };

  const stickyCta =
    !content
      ? null
      : tab === "brow"
        ? browCta(browCourse, content.browPrice, content.texts)
        : permanentCta(content.whatsapp, content.texts);

  useEffect(() => {
    // Внутри предпросмотра админки показываем главную как гостю
    if (isAuthenticated && !isPreviewFrame()) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated && !isPreviewFrame()) {
    return null;
  }

  return (
    <>
      <Header />
      <main className={`${manrope.className} w-full bg-white text-landing-plum`}>
        {/* ── Автор: фото и информация ──────────────────────────── */}
        <section
          ref={authorRef}
          id="author"
          className="relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-landing-blush to-white px-4 pb-12 pt-10 md:px-6 md:pb-20 md:pt-16 lg:px-8"
        >
          <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-landing-pink/15 blur-3xl" />
          {author ? (
            <div
              className={`relative mx-auto grid max-w-7xl items-center gap-10 md:gap-14 ${
                author.authorPhoto ? "lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" : ""
              }`}
            >
              {author.authorPhoto && (
                <div className="animate-fade-in motion-reduce:animate-none">
                  {/* Фото автора горизонтальное — показываем 4:3, без обрезки лица */}
                  <img
                    src={author.authorPhoto}
                    alt={author.authorName || "Автор курсов"}
                    className="mx-auto aspect-[4/3] w-full max-w-2xl rounded-[32px] object-cover object-[40%_35%] shadow-[0_30px_70px_-30px_rgba(86,62,79,0.6)] ring-1 ring-landing-plum/5 lg:max-w-none"
                  />
                </div>
              )}
              <div className="animate-fade-in motion-reduce:animate-none">
                <p className="mb-3 text-xs md:text-sm font-extrabold uppercase tracking-widest text-landing-pink">
                  {author.authorRole || "Автор курсов"}
                </p>
                <h1 className="text-[2.4rem] leading-[1] md:text-6xl font-extrabold uppercase tracking-tight">
                  {author.authorName || "Об авторе"}
                </h1>
                {author.authorBio && (
                  <p className="mt-6 whitespace-pre-line text-base md:text-lg text-landing-plum/80">
                    {author.authorBio}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="relative mx-auto max-w-5xl py-6 text-center">
              <h1 className="text-[2.6rem] leading-[0.95] md:text-7xl font-extrabold uppercase tracking-tight">
                Курсы <span className="text-landing-pink">KursGalaxy</span>
              </h1>
            </div>
          )}
        </section>

        {/* ── Вкладки курсов ───────────────────────────────────── */}
        <section
          ref={tabsRef}
          id="courses"
          className="scroll-mt-16 px-4 pb-12 md:px-6 md:pb-20 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <p id="courses-label" className="mb-1 text-center text-xs md:text-sm font-extrabold uppercase tracking-widest text-landing-plum/60">
              {content?.texts.chooseCourse ?? "Выберите курс"}
            </p>
            {/* Переключатель: две половины, как на схеме. Липнет под шапкой */}
            <div className="sticky top-16 z-20 -mx-4 bg-white/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
              <div
                role="tablist"
                aria-labelledby="courses-label"
                onKeyDown={onTabsKey}
                className="grid grid-cols-2 gap-1 rounded-full bg-landing-blush p-1"
              >
                {COURSE_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    id={`tab-${t.id}`}
                    aria-selected={tab === t.id}
                    aria-controls={`panel-${t.id}`}
                    tabIndex={tab === t.id ? 0 : -1}
                    onClick={() => pickTab(t.id)}
                    className={`min-h-[52px] rounded-full px-3 text-sm md:text-lg font-extrabold uppercase leading-tight tracking-tight transition-colors ${focusRing} ${
                      tab === t.id
                        ? "bg-landing-pink text-white shadow-[0_10px_30px_-12px_rgba(245,73,160,0.8)]"
                        : "text-landing-plum hover:text-landing-pink"
                    }`}
                  >
                    {content ? (t.id === "brow" ? content.texts.tabBrow : content.texts.tabPermanent) : t.name}
                  </button>
                ))}
              </div>
            </div>

            {content && (
              <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
                {content.layout[tab]
                  .filter((b) => !b.hidden)
                  .map((b) => (
                    <Fragment key={`${tab}-${b.id}`}>{renderBlock(b.id)}</Fragment>
                  ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Отзывы ───────────────────────────────────────────── */}
        {content && content.reviews.length > 0 && !content.layout.hideReviews && (
        <section
          id="reviews"
          className="scroll-mt-20 bg-landing-plum px-4 py-16 md:px-6 md:py-24 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <SectionTitle top={content.texts.reviewsTop} accent={content.texts.reviewsAccent} dark />
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

        {/* ── FAQ ──────────────────────────────────────────────── */}
        {content && content.faq.length > 0 && !content.layout.hideFaq && (
        <section id="faq" className="scroll-mt-20 bg-landing-cream px-4 py-16 md:px-6 md:py-24 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_1.5fr] lg:gap-10">
            <SectionTitle
              top={content.texts.faqTop}
              accent={content.texts.faqAccent}
              lead={content.texts.faqLead}
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
      </main>

      <div className={manrope.className}>
        <LandingFooter />
      </div>
      {/* Отступ, чтобы плавающая кнопка не закрывала низ футера на телефоне */}
      <div className="h-24 bg-landing-pink-dark md:hidden" aria-hidden />

      {/* ── Плавающая кнопка действия текущей вкладки (только телефон) ── */}
      {content && (
        <div
          className={`${manrope.className} fixed inset-x-0 bottom-0 z-30 border-t border-landing-plum/10 bg-white/95 p-3 backdrop-blur transition-all duration-300 motion-reduce:transition-none md:hidden ${
            showStickyCta ? "visible translate-y-0" : "invisible translate-y-full"
          }`}
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          {stickyCta && <CtaLink cta={stickyCta} short className={`${pinkButtonCls} w-full`} />}
        </div>
      )}
    </>
  );
}
