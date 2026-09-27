import { prisma } from '@/lib/db';

// Контент главной страницы, который автор курсов редактирует сам
// в админке (Админка → Главная страница). Одна запись id="default".

const SINGLETON_ID = 'default';

export type AuthorFact = { title: string; text: string };
export type WorkPhoto = { src: string; alt: string };
export type ResultCard = { photo: string; tag: string; before: string[]; after: string[] };
export type Review = { text: string; name: string };
export type FaqItem = { q: string; a: string };

export interface LandingContentData {
  authorName: string;
  authorRole: string;
  authorPhoto: string;
  authorBio: string;
  authorFacts: AuthorFact[];
  works: WorkPhoto[];
  results: ResultCard[];
  reviews: Review[];
  faq: FaqItem[];
}

// Начальное наполнение при первом открытии: реальные фото работ и базовый FAQ.
// Отзывы и истории учениц не выдумываем — их добавляет автор.
const DEFAULTS: LandingContentData = {
  authorName: '',
  authorRole: 'бровист, автор курсов',
  authorPhoto: '/landing/author.jpg',
  authorBio: '',
  authorFacts: [
    {
      title: 'Концепция',
      text: 'Натуральные брови, которые стоят дорого и которым может научиться каждый',
    },
  ],
  works: [
    { src: '/landing/works/brows-1.jpg', alt: 'Брови до и после окрашивания' },
    { src: '/landing/works/brows-2.jpg', alt: 'Натуральные брови до и после' },
    { src: '/landing/works/brows-3.jpg', alt: 'Коррекция и окрашивание бровей до и после' },
    { src: '/landing/works/brows-4.jpg', alt: 'Оформление бровей до и после' },
    { src: '/landing/works/brows-5.jpg', alt: 'Брови хной до и после' },
  ],
  results: [],
  reviews: [],
  faq: [
    {
      q: 'Подойдёт ли мне курс, если я обучаюсь с 0?',
      a: 'Да. Уроки идут от простого к сложному: от анализа исходника и построения формы до окрашивания хной и краской и колористики.',
    },
    {
      q: 'Как оплатить курс?',
      a: 'Выберите курс, нажмите «Выбрать тариф» и оплатите подходящий вариант. После оплаты доступ к урокам откроется в личном кабинете.',
    },
    {
      q: 'Сколько длится доступ к урокам?',
      a: 'Срок зависит от тарифа — он указан в описании каждого тарифа на странице курса.',
    },
    {
      q: 'Выдаётся ли сертификат?',
      a: 'Да, после прохождения всех уроков курса сертификат можно скачать в профиле. Его подлинность проверяется по QR-коду.',
    },
    {
      q: 'Можно ли смотреть уроки с телефона?',
      a: 'Да, платформа полностью адаптирована под смартфоны — смотрите уроки где удобно, прогресс сохраняется автоматически.',
    },
  ],
};

// ─── Валидация входящих данных из админки ──────────────────────────────────

const LIMITS = { short: 120, text: 600, bio: 2000, list: 30, lines: 8 };

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

/** Картинки — только наши локальные пути, никаких внешних URL и javascript: */
function imgPath(v: unknown): string {
  const s = str(v, 300);
  return /^\/[\w\-./]+\.(jpe?g|png|webp)$/i.test(s) && !s.includes('..') ? s : '';
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v.slice(0, LIMITS.list) : [];
}

function lines(v: unknown): string[] {
  return (Array.isArray(v) ? v : [])
    .map((x) => str(x, LIMITS.short))
    .filter(Boolean)
    .slice(0, LIMITS.lines);
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {});

export function sanitizeLandingContent(input: unknown): LandingContentData {
  const b = obj(input);
  return {
    authorName: str(b.authorName, LIMITS.short),
    authorRole: str(b.authorRole, LIMITS.short),
    authorPhoto: imgPath(b.authorPhoto),
    authorBio: str(b.authorBio, LIMITS.bio),
    authorFacts: arr(b.authorFacts)
      .map(obj)
      .map((f) => ({ title: str(f.title, LIMITS.short), text: str(f.text, LIMITS.text) }))
      .filter((f) => f.title || f.text),
    works: arr(b.works)
      .map(obj)
      .map((w) => ({ src: imgPath(w.src), alt: str(w.alt, LIMITS.short) }))
      .filter((w) => w.src),
    results: arr(b.results)
      .map(obj)
      .map((r) => ({
        photo: imgPath(r.photo),
        tag: str(r.tag, LIMITS.short),
        before: lines(r.before),
        after: lines(r.after),
      }))
      .filter((r) => r.photo),
    reviews: arr(b.reviews)
      .map(obj)
      .map((r) => ({ text: str(r.text, LIMITS.text), name: str(r.name, LIMITS.short) }))
      .filter((r) => r.text),
    faq: arr(b.faq)
      .map(obj)
      .map((f) => ({ q: str(f.q, LIMITS.short * 2), a: str(f.a, LIMITS.bio) }))
      .filter((f) => f.q && f.a),
  };
}

// ─── Чтение / запись ────────────────────────────────────────────────────────

export async function loadLandingContent(): Promise<LandingContentData> {
  let row = await prisma.landingContent.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) {
    row = await prisma.landingContent.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...DEFAULTS },
      update: {},
    });
  }
  // Прогоняем через санитайзер — на случай ручных правок в БД
  return sanitizeLandingContent(row);
}

export async function saveLandingContent(data: LandingContentData): Promise<void> {
  await prisma.landingContent.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...data },
    update: data,
  });
}
