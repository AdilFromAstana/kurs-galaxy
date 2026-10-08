// Контент главной: типы, значения по умолчанию и проверка входящих данных.
// Без обращения к БД — этот файл можно импортировать и в браузерный код
// (админка, главная). Чтение/запись в БД — lib/landingContent.ts.

export type AuthorFact = { title: string; text: string };
export type WorkPhoto = { src: string; alt: string };
export type ResultCard = { photo: string; tag: string; before: string[]; after: string[] };
export type Review = { text: string; name: string };
export type FaqItem = { q: string; a: string };
export type Step = { days: string; format: string; title: string; points: string[] };

// ─── Порядок и видимость блоков на вкладках курсов ──────────────────────────
export type BlockId = 'facts' | 'steps' | 'myWorks' | 'studentWorks' | 'modules' | 'price';
export type BlockState = { id: BlockId; hidden: boolean };
export type CourseTabId = 'brow' | 'permanent';
export interface LandingLayout {
  brow: BlockState[];
  permanent: BlockState[];
  firstTab: CourseTabId;
  /** Какой курс продаётся во вкладке «Бровист»; '' — найти по слову «бров» в названии */
  browCourseId: string;
  hideReviews: boolean;
  hideFaq: boolean;
}

/** Какие блоки бывают на вкладке — в порядке «по умолчанию» (как на схеме автора). */
export const TAB_BLOCKS: Record<CourseTabId, BlockId[]> = {
  brow: ['myWorks', 'studentWorks', 'modules', 'price'],
  permanent: ['facts', 'steps', 'myWorks', 'studentWorks', 'price'],
};

export const BLOCK_NAMES: Record<BlockId, string> = {
  facts: 'Почему этот курс (карточки)',
  steps: 'Как проходит обучение',
  myWorks: 'Мои работы',
  studentWorks: 'Работы учениц',
  modules: 'Что входит в обучение (разделы курса)',
  price: 'Цена и кнопка записи / покупки',
};

export const DEFAULT_LAYOUT: LandingLayout = {
  brow: TAB_BLOCKS.brow.map((id) => ({ id, hidden: false })),
  permanent: TAB_BLOCKS.permanent.map((id) => ({ id, hidden: false })),
  firstTab: 'brow',
  browCourseId: '',
  hideReviews: false,
  hideFaq: false,
};

// ─── Тексты сайта, которые автор меняет сама ────────────────────────────────
// Заголовки — в две строки: первая тёмная, вторая розовая.
export const DEFAULT_TEXTS = {
  tabBrow: 'Бровист с 0',
  tabPermanent: 'Натуральный перманент',
  chooseCourse: 'Выберите курс',
  myWorksTop: 'Мои',
  myWorksAccent: 'работы',
  studentWorksTop: 'Работы',
  studentWorksAccent: 'учениц',
  modulesTop: 'Что входит',
  modulesAccent: 'в обучение',
  factsTop: 'Почему',
  factsAccent: 'натуральный перманент',
  stepsTop: 'Как проходит',
  stepsAccent: 'обучение',
  reviewsTop: 'Что говорят',
  reviewsAccent: 'наши ученицы',
  faqTop: 'Вопрос /',
  faqAccent: 'ответ',
  faqLead: 'Не нашли ответ? Напишите нам — контакты внизу страницы.',
  browBuy: 'Купить и начать обучение',
  browPriceNote: 'Доступ к урокам открывается сразу после оплаты',
  permanentPriceLabel: 'Цена обучения',
  permanentNoPrice: 'Уточняйте при записи',
  permanentButton: 'Написать в WhatsApp',
  permanentGreeting: 'Здравствуйте! Хочу записаться на обучение «Натуральный перманент»',
  siteGreeting: 'Здравствуйте! Пишу с сайта KursGalaxy.kz',
  // Сайт целиком
  siteName: 'KursGalaxy.kz',
  seoTitle: 'Бровист с 0 и натуральный перманент — KursGalaxy.kz',
  seoDescription:
    'Курсы Камилы Нуртаевой: «Бровист с 0» онлайн — брови хной и краской, колористика; «Натуральный перманент» — онлайн-подготовка и практика на моделях',
  navAuthor: 'Об авторе',
  navReviews: 'Отзывы',
  navFaq: 'Вопросы',
  // Форма заявки внизу сайта
  footerFormTitle: 'Остались вопросы?',
  footerFormLead: 'Оставьте заявку, и мы свяжемся с вами',
  footerSuccessTitle: 'Заявка отправлена!',
  footerSuccessText: 'Мы свяжемся с вами в ближайшее время.',
  // Каталог
  catalogTop: 'Каталог',
  catalogAccent: 'курсов',
  catalogLead: 'Выберите курс и начните учиться в своём темпе — от первых бровей до высокого чека',
  // Страница курса
  coursePerk1: 'Смотрите с телефона и компьютера',
  coursePerk2: 'Учитесь в своём темпе',
  coursePerk3: 'Безопасная оплата картой',
  courseBuy: 'Купить курс',
  courseEnroll: 'Записаться на курс',
  courseWatchFree: 'Смотреть бесплатно',
  courseNoPriceTitle: 'Запись открыта',
  courseNoPriceText: 'Оставьте заявку — расскажем о программе, тарифах и стоимости обучения.',
  courseNoPriceButton: 'Узнать стоимость',
  courseProgramTop: 'Программа',
  courseProgramAccent: 'курса',
  // Страница ссылок /links — одна ссылка для профиля Instagram, внутри кнопки на курсы
  linksBrowNote: 'Онлайн-курс · доступ к урокам сразу после оплаты',
  linksPermanentNote: 'Онлайн-подготовка и практика на моделях',
  linksWhatsapp: 'Написать мне в WhatsApp',
  // Покупка курса (пока оплата на сайте не подключена — через WhatsApp)
  buyTitle: 'Как купить курс',
  buyNote: 'Оплата — через WhatsApp. После оплаты пришлём ссылку, по которой курс откроется в вашем кабинете.',
  buyButton: 'Написать в WhatsApp для оплаты',
  buyGreeting: 'Здравствуйте! Хочу купить курс «{курс}»{тариф}',
};

/** Длинные тексты (описания, подписи) — до 600 символов, остальное — до 120. */
const LONG_TEXTS: TextKey[] = [
  'faqLead', 'browPriceNote', 'permanentGreeting', 'siteGreeting', 'seoDescription',
  'footerFormLead', 'footerSuccessText', 'catalogLead', 'courseNoPriceText',
  'linksBrowNote', 'linksPermanentNote', 'buyNote', 'buyGreeting',
];
export type LandingTexts = typeof DEFAULT_TEXTS;
export type TextKey = keyof LandingTexts;

export const DEFAULT_STEPS_LEAD = '10 дней: неделя онлайн-подготовки и 3 дня практики на моделях';
export const DEFAULT_STEPS: Step[] = [
  {
    days: '1–7 день',
    format: 'онлайн',
    title: 'Онлайн-подготовка',
    points: [
      'Уроки на сайте: мои показы на моделях и вся теория по перманенту',
      'Материалы остаются с вами и после обучения',
      'Домашнее задание',
    ],
  },
  {
    days: '8 день',
    format: 'очно',
    title: 'Знакомство и постановка руки',
    points: [
      'Разбираем пройденный материал',
      'Ставим руку и тренируем штрихи на латексе',
      'Строим эскиз на манекене',
    ],
  },
  {
    days: '9 день',
    format: 'очно',
    title: 'Мой показ на модели',
    points: ['Показываю работу на модели — брови или губы на выбор', 'Вы работаете с моделью на зоне бровей'],
  },
  {
    days: '10 день',
    format: 'очно',
    title: 'Практика и сертификат',
    points: ['Две модели: зона бровей и зона губ', 'Вручение сертификата'],
  },
];

export interface LandingContentData {
  authorName: string;
  authorRole: string;
  authorPhoto: string;
  authorBio: string;
  authorFacts: AuthorFact[];
  authorWorks: WorkPhoto[];
  works: WorkPhoto[];
  results: ResultCard[];
  reviews: Review[];
  faq: FaqItem[];
  // Вкладка «Бровист с 0»; authorWorks/works выше — вкладка «Натуральный перманент»
  browAuthorWorks: WorkPhoto[];
  browWorks: WorkPhoto[];
  browPrice: string;
  permanentPrice: string;
  permanentNote: string;
  whatsapp: string;
  // План «Как проходит обучение» (вкладка перманента) и подзаголовок над ним
  steps: Step[];
  stepsLead: string;
  layout: LandingLayout;
  texts: LandingTexts;
}

// Начальное наполнение при первом открытии: реальные фото работ и базовый FAQ.
// Отзывы и истории учениц не выдумываем — их добавляет автор.
export const DEFAULTS: LandingContentData = {
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
  authorWorks: [],
  works: [
    { src: '/landing/works/brows-1.jpg', alt: 'Брови до и после окрашивания' },
    { src: '/landing/works/brows-2.jpg', alt: 'Натуральные брови до и после' },
    { src: '/landing/works/brows-3.jpg', alt: 'Коррекция и окрашивание бровей до и после' },
    { src: '/landing/works/brows-4.jpg', alt: 'Оформление бровей до и после' },
    { src: '/landing/works/brows-5.jpg', alt: 'Брови хной до и после' },
  ],
  results: [],
  reviews: [],
  browAuthorWorks: [],
  browWorks: [],
  browPrice: '',
  permanentPrice: '',
  permanentNote: '',
  whatsapp: '',
  steps: DEFAULT_STEPS,
  stepsLead: DEFAULT_STEPS_LEAD,
  layout: DEFAULT_LAYOUT,
  texts: DEFAULT_TEXTS,
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

// Галереи фото: до 60 штук — автору удобно выложить портфолио целиком
function photos(v: unknown): WorkPhoto[] {
  return (Array.isArray(v) ? v.slice(0, 60) : [])
    .map(obj)
    .map((w) => ({ src: imgPath(w.src), alt: str(w.alt, LIMITS.short) }))
    .filter((w) => w.src);
}

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
    authorWorks: photos(b.authorWorks),
    works: photos(b.works),
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
    browAuthorWorks: photos(b.browAuthorWorks),
    browWorks: photos(b.browWorks),
    browPrice: str(b.browPrice, LIMITS.short),
    permanentPrice: str(b.permanentPrice, LIMITS.short),
    permanentNote: str(b.permanentNote, LIMITS.text),
    // Только цифры номера — из них собираем ссылку wa.me
    whatsapp: str(b.whatsapp, 30).replace(/\D/g, ''),
    // null в БД — ещё ни разу не сохраняли: показываем план по умолчанию.
    // Пустой массив — автор сам убрал все шаги.
    steps:
      b.steps == null
        ? DEFAULT_STEPS
        : arr(b.steps)
            .map(obj)
            .map((x) => ({
              days: str(x.days, 40),
              format: str(x.format, 40),
              title: str(x.title, LIMITS.short),
              points: lines(x.points),
            }))
            .filter((x) => x.title || x.points.length),
    stepsLead: b.stepsLead == null ? DEFAULT_STEPS_LEAD : str(b.stepsLead, LIMITS.text),
    layout: sanitizeLayout(b.layout),
    texts: sanitizeTexts(b.texts),
  };
}

/** Пустое поле — значит «как было»: подставляем текст по умолчанию, чтобы на сайте не было дыр. */
function sanitizeTexts(v: unknown): LandingTexts {
  const t = obj(v);
  const out = { ...DEFAULT_TEXTS };
  for (const key of Object.keys(DEFAULT_TEXTS) as TextKey[]) {
    const val = str(t[key], LONG_TEXTS.includes(key) ? LIMITS.text : LIMITS.short);
    if (val) out[key] = val;
  }
  return out;
}

/** Каждый блок вкладки ровно один раз; неизвестные выкидываем, новые (после обновления сайта) — в конец. */
function blocks(v: unknown, allowed: BlockId[]): BlockState[] {
  const seen = new Set<BlockId>();
  const out: BlockState[] = [];
  for (const x of arr(v).map(obj)) {
    const id = x.id as BlockId;
    if (!allowed.includes(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, hidden: x.hidden === true });
  }
  for (const id of allowed) if (!seen.has(id)) out.push({ id, hidden: false });
  return out;
}

function sanitizeLayout(v: unknown): LandingLayout {
  const l = obj(v);
  return {
    brow: blocks(l.brow, TAB_BLOCKS.brow),
    permanent: blocks(l.permanent, TAB_BLOCKS.permanent),
    firstTab: l.firstTab === 'permanent' ? 'permanent' : 'brow',
    browCourseId: str(l.browCourseId, 60),
    hideReviews: l.hideReviews === true,
    hideFaq: l.hideFaq === true,
  };
}

