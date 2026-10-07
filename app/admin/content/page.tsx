'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Crop,
  ExternalLink,
  Eye,
  EyeOff,
  HelpCircle,
  ImagePlus,
  Images,
  LayoutTemplate,
  Loader2,
  MessageSquare,
  Plus,
  Save,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DevicePreviewModal, PreviewButton } from '@/components/admin/DevicePreviewModal';
import { CROP, useImageCropper, type CropOptions } from '@/components/admin/ImageCropper';
import { invalidateLandingContent } from '@/hooks/useLandingContent';
import { compressImage } from '@/lib/compressImage';
import {
  BLOCK_NAMES,
  type AuthorFact,
  type BlockState,
  type CourseTabId,
  type LandingLayout,
  type Step,
} from '@/lib/landingContent';
import type {
  FaqItem,
  LandingContentData,
  ResultCard,
  Review,
  WorkPhoto,
} from '@/lib/landingContent';

const TABS = [
  { id: 'author', name: 'Об авторе', icon: User },
  { id: 'layout', name: 'Порядок блоков', icon: LayoutTemplate },
  { id: 'brow', name: 'Бровист с 0', icon: Images },
  { id: 'permanent', name: 'Натуральный перманент', icon: Camera },
  { id: 'results', name: 'Результаты', icon: Sparkles },
  { id: 'reviews', name: 'Отзывы', icon: MessageSquare },
  { id: 'faq', name: 'Вопросы', icon: HelpCircle },
] as const;
type TabId = (typeof TABS)[number]['id'];

// Какой раздел главной показывать в предпросмотре для каждой вкладки
const TAB_ANCHOR: Record<TabId, string> = {
  author: 'author',
  layout: 'courses',
  brow: 'brow',
  permanent: 'permanent',
  results: 'permanent',
  reviews: 'reviews',
  faq: 'faq',
};

const inputCls =
  'w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

export default function LandingContentPage() {
  const [content, setContent] = useState<LandingContentData | null>(null);
  // Версия, которую редактируем: сервер не даст сохранить поверх более новой
  const [version, setVersion] = useState<string | null>(null);
  // Контент в том виде, как его загрузили: по нему видно, какие поля правили здесь
  const baseRef = useRef<LandingContentData | null>(null);
  const [tab, setTab] = useState<TabId>('author');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/site-content', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
        setVersion(data.version);
        baseRef.current = data.content;
      }
      else setError('Не удалось загрузить контент');
    })();
  }, []);

  // Предупреждаем о несохранённых изменениях при закрытии вкладки
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const patch = (p: Partial<LandingContentData>) => {
    setContent((c) => (c ? { ...c, ...p } : c));
    setDirty(true);
  };

  const put = (body: LandingContentData, v: string | null) =>
    fetch('/api/admin/site-content', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: body, version: v }),
    });

  const save = async () => {
    if (!content) return;
    setSaving(true);
    setError(null);
    try {
      let res = await put(content, version);
      let merged = false;
      // Пока редактировали, главную изменили в другом месте (другая вкладка, телефон,
      // правка разработчика). Не теряем ни то, ни другое: берём свежую версию
      // и накладываем поверх только те разделы, которые меняли здесь.
      if (res.status === 409) {
        const fresh = await fetch('/api/admin/site-content', { credentials: 'include' });
        if (!fresh.ok) throw new Error('Не удалось сохранить — обновите страницу');
        const server = (await fresh.json()) as { content: LandingContentData; version: string };
        const base = baseRef.current;
        const next = { ...server.content } as Record<string, unknown>;
        for (const key of Object.keys(content) as (keyof LandingContentData)[]) {
          const mine = JSON.stringify(content[key]);
          if (!base || mine !== JSON.stringify(base[key])) next[key] = content[key];
        }
        res = await put(next as unknown as LandingContentData, server.version);
        merged = true;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Не удалось сохранить');
      setContent(data.content);
      setVersion(data.version);
      baseRef.current = data.content;
      setDirty(false);
      invalidateLandingContent();
      toast.success(
        merged
          ? 'Сохранено. Изменения из другой вкладки тоже сохранены'
          : 'Сохранено — изменения уже на сайте',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  if (!content) {
    return (
      <div className="flex justify-center py-12">
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-40 md:pb-28 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <LayoutTemplate className="w-8 h-8 text-primary-600" />
            Главная страница
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Информация об авторе, работы и отзывы учениц, вопросы и ответы. Пустые блоки на сайте не
            показываются.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PreviewButton onClick={() => setPreviewOpen(true)} />
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg"
          >
            <ExternalLink className="w-4 h-4" />
            Открыть сайт
          </a>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.name}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {tab === 'author' && (
        <Card
          title="Об авторе курсов"
          hint="Самый верх главной: фото и информация о вас, под ними — вкладки курсов."
        >
          <div className="grid gap-6 md:grid-cols-[240px_1fr]">
            <ImageField
              label="Фото"
              value={content.authorPhoto}
              onChange={(v) => patch({ authorPhoto: v })}
              aspect="aspect-[4/3]"
              crop={{
                title: 'Фото автора',
                aspects: [CROP.landscape],
                previewLabel: 'Блок «Об авторе» на главной — лицо лучше держать ближе к центру',
              }}
            />
            <div className="space-y-4">
              <Field label="Имя и фамилия">
                <input
                  className={inputCls}
                  value={content.authorName}
                  onChange={(e) => patch({ authorName: e.target.value })}
                  placeholder="Например: Камила Ахметова"
                  maxLength={120}
                />
              </Field>
              <Field label="Кто вы (подпись под именем)">
                <input
                  className={inputCls}
                  value={content.authorRole}
                  onChange={(e) => patch({ authorRole: e.target.value })}
                  placeholder="бровист, автор курсов"
                  maxLength={120}
                />
              </Field>
              <Field label="Коротко о себе (необязательно)">
                <textarea
                  className={inputCls}
                  rows={4}
                  value={content.authorBio}
                  onChange={(e) => patch({ authorBio: e.target.value })}
                  placeholder="Пара предложений о вашем опыте и подходе"
                  maxLength={2000}
                />
              </Field>
            </div>
          </div>
        </Card>
      )}

      {tab === 'layout' && (
        <>
          <Card
            title="Какая вкладка открывается первой"
            hint="Посетитель сразу видит эту вкладку. Переключатель на сайте остаётся: «Бровист с 0» слева, «Натуральный перманент» справа."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {(['brow', 'permanent'] as CourseTabId[]).map((id) => (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                    content.layout.firstTab === id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="firstTab"
                    checked={content.layout.firstTab === id}
                    onChange={() => patch({ layout: { ...content.layout, firstTab: id } })}
                    className="h-4 w-4"
                  />
                  <span className="font-semibold text-gray-900">
                    {id === 'brow' ? 'Бровист с 0' : 'Натуральный перманент'}
                  </span>
                </label>
              ))}
            </div>
          </Card>
          {(['brow', 'permanent'] as CourseTabId[]).map((tabId) => (
            <Card
              key={tabId}
              title={`Блоки вкладки «${tabId === 'brow' ? 'Бровист с 0' : 'Натуральный перманент'}»`}
              hint="Стрелками меняйте порядок, переключателем — показывать блок или нет. Скрытый блок не удаляется: его содержимое сохранится, можно вернуть в любой момент."
            >
              <BlocksEditor
                items={content.layout[tabId]}
                emptyHint={(id) => blockEmptyHint(content, tabId, id)}
                onChange={(items) => patch({ layout: { ...content.layout, [tabId]: items } as LandingLayout })}
              />
            </Card>
          ))}
          <Card title="Общие блоки под вкладками" hint="Показываются под любой вкладкой.">
            <div className="space-y-2">
              <Toggle
                label="Отзывы учениц"
                note={content.reviews.length ? `${content.reviews.length} шт.` : 'пока нет — блок и так не виден'}
                on={!content.layout.hideReviews}
                onChange={(on) => patch({ layout: { ...content.layout, hideReviews: !on } })}
              />
              <Toggle
                label="Вопросы и ответы"
                note={content.faq.length ? `${content.faq.length} шт.` : 'пока нет — блок и так не виден'}
                on={!content.layout.hideFaq}
                onChange={(on) => patch({ layout: { ...content.layout, hideFaq: !on } })}
              />
            </div>
          </Card>
        </>
      )}

      {tab === 'brow' && (
        <>
          <Card
            title="Бровист с 0 — МОИ работы"
            hint="Ваши собственные работы по бровям — на сайте блок «Мои работы». Работы выпускниц — в карточке ниже."
          >
            <GalleryEditor
              items={content.browAuthorWorks}
              onChange={(browAuthorWorks) => patch({ browAuthorWorks })}
              moveTo={{
                label: 'Работы учениц',
                onMove: (w) =>
                  patch({
                    browAuthorWorks: content.browAuthorWorks.filter((x) => x.src !== w.src),
                    browWorks: [...content.browWorks, w],
                  }),
              }}
              crop={{
                title: 'Моя работа — брови',
                aspects: [CROP.square, CROP.portrait, CROP.landscape, CROP.original],
                previewLabel: 'Плитка в галерее «Мои работы» — по клику фото открывается целиком',
              }}
            />
          </Card>
          <Card
            title="Бровист с 0 — работы УЧЕНИЦ"
            hint="Работы выпускниц курса по бровям — на сайте карусель «Работы учениц» под вашими работами."
          >
            <GalleryEditor
              items={content.browWorks}
              onChange={(browWorks) => patch({ browWorks })}
              moveTo={{
                label: 'Мои работы',
                onMove: (w) =>
                  patch({
                    browWorks: content.browWorks.filter((x) => x.src !== w.src),
                    browAuthorWorks: [...content.browAuthorWorks, w],
                  }),
              }}
              crop={{
                title: 'Работа ученицы — брови',
                aspects: [CROP.landscape, CROP.square, CROP.original],
                previewLabel: 'Фото в карусели «Работы учениц»',
              }}
            />
          </Card>
          <Card
            title="Бровист с 0 — разделы и цена"
            hint="Названия разделов берутся из курса (Курсы → редактирование). Цена — из тарифов курса; если тарифов нет, показываем цену, указанную здесь."
          >
            <Field label="Цена, если у курса нет тарифов">
              <input
                className={inputCls}
                value={content.browPrice}
                onChange={(e) => patch({ browPrice: e.target.value })}
                placeholder="Например: 49 000 ₸"
                maxLength={120}
              />
            </Field>
          </Card>
        </>
      )}

      {tab === 'permanent' && (
        <>
          <Card
            title="Натуральный перманент — почему этот курс"
            hint="Карточки в начале вкладки «Натуральный перманент»: Техника, Прайс, Продвижение, Закуп материалов и т.п."
          >
            <ListEditor<AuthorFact>
              items={content.authorFacts}
              onChange={(authorFacts) => patch({ authorFacts })}
              empty={{ title: '', text: '' }}
              addLabel="Добавить карточку"
              render={(f, set) => (
                <div className="grid gap-3 md:grid-cols-[200px_1fr]">
                  <input
                    className={inputCls}
                    value={f.title}
                    onChange={(e) => set({ ...f, title: e.target.value })}
                    placeholder="Заголовок: Техника"
                    maxLength={120}
                  />
                  <textarea
                    className={inputCls}
                    rows={2}
                    value={f.text}
                    onChange={(e) => set({ ...f, text: e.target.value })}
                    placeholder="Текст: процедура, на которую не нужно искать клиентов"
                    maxLength={600}
                  />
                </div>
              )}
            />
          </Card>
          <Card
            title="Натуральный перманент — как проходит обучение"
            hint="План по дням. Каждый пункт — с новой строки. Порядок шагов — стрелками справа."
          >
            <Field label="Подзаголовок над планом">
              <input
                className={inputCls}
                value={content.stepsLead}
                onChange={(e) => patch({ stepsLead: e.target.value })}
                placeholder="10 дней: неделя онлайн-подготовки и 3 дня практики на моделях"
                maxLength={600}
              />
            </Field>
            <div className="mt-4">
              <ListEditor<Step>
                items={content.steps}
                onChange={(steps) => patch({ steps })}
                empty={{ days: '', format: 'очно', title: '', points: [] }}
                addLabel="Добавить шаг"
                render={(st, set) => (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                      <input
                        className={inputCls}
                        value={st.days}
                        onChange={(e) => set({ ...st, days: e.target.value })}
                        placeholder="Когда: 8 день"
                        maxLength={40}
                      />
                      <select
                        className={inputCls}
                        value={st.format}
                        onChange={(e) => set({ ...st, format: e.target.value })}
                        aria-label="Формат"
                      >
                        <option value="онлайн">онлайн</option>
                        <option value="очно">очно</option>
                      </select>
                    </div>
                    <input
                      className={`${inputCls} font-semibold`}
                      value={st.title}
                      onChange={(e) => set({ ...st, title: e.target.value })}
                      placeholder="Название шага: Постановка руки"
                      maxLength={120}
                    />
                    <LinesInput
                      value={st.points}
                      onChange={(points) => set({ ...st, points })}
                      placeholder={'Разбираем пройденный материал\nСтавим руку на латексе'}
                    />
                  </div>
                )}
              />
            </div>
          </Card>
          <Card
            title="Натуральный перманент — МОИ работы"
            hint="Ваши собственные работы по перманенту — на сайте блок «Мои работы». Работы выпускниц — в карточке ниже."
          >
            <GalleryEditor
              items={content.authorWorks}
              onChange={(authorWorks) => patch({ authorWorks })}
              moveTo={{
                label: 'Работы учениц',
                onMove: (w) =>
                  patch({
                    authorWorks: content.authorWorks.filter((x) => x.src !== w.src),
                    works: [...content.works, w],
                  }),
              }}
              crop={{
                title: 'Моя работа — перманент',
                aspects: [CROP.square, CROP.portrait, CROP.landscape, CROP.original],
                previewLabel: 'Плитка в галерее «Мои работы» — по клику фото открывается целиком',
              }}
            />
          </Card>
          <Card
            title="Натуральный перманент — работы УЧЕНИЦ"
            hint="Работы выпускниц курса по перманенту — на сайте карусель «Работы учениц». Карточки с описанием — во вкладке «Результаты»."
          >
            <GalleryEditor
              items={content.works}
              onChange={(works) => patch({ works })}
              moveTo={{
                label: 'Мои работы',
                onMove: (w) =>
                  patch({
                    works: content.works.filter((x) => x.src !== w.src),
                    authorWorks: [...content.authorWorks, w],
                  }),
              }}
              crop={{
                title: 'Работа ученицы — перманент',
                aspects: [CROP.landscape, CROP.square, CROP.original],
                previewLabel: 'Фото в карусели «Работы учениц»',
              }}
            />
          </Card>
          <Card
            title="Цена обучения и запись"
            hint="Под ценой — кнопка «Написать в WhatsApp». Без номера кнопка не показывается."
          >
            <div className="space-y-4">
              <Field label="Цена обучения">
                <input
                  className={inputCls}
                  value={content.permanentPrice}
                  onChange={(e) => patch({ permanentPrice: e.target.value })}
                  placeholder="Например: 350 000 ₸"
                  maxLength={120}
                />
              </Field>
              <Field label="Пояснение под ценой (необязательно)">
                <textarea
                  className={inputCls}
                  rows={3}
                  value={content.permanentNote}
                  onChange={(e) => patch({ permanentNote: e.target.value })}
                  placeholder="Например: стартовый набор в подарок, возможна рассрочка"
                  maxLength={600}
                />
              </Field>
              <Field label="Номер WhatsApp для записи">
                <input
                  className={inputCls}
                  type="tel"
                  inputMode="tel"
                  value={content.whatsapp}
                  onChange={(e) => patch({ whatsapp: e.target.value })}
                  placeholder="+7 708 855 64 04"
                  maxLength={30}
                />
              </Field>
            </div>
          </Card>
        </>
      )}

      {tab === 'results' && (
        <Card
          title="Результаты учениц — карточки «до / после»"
          hint="Карточки во вкладке «Натуральный перманент» под каруселью работ учениц: фото и что изменилось после курса. Карточка без фото не сохранится."
        >
          <ListEditor<ResultCard>
            items={content.results}
            onChange={(results) => patch({ results })}
            empty={{ photo: '', tag: '', before: [], after: [] }}
            addLabel="Добавить карточку"
            render={(r, set) => (
              <div className="grid gap-4 sm:grid-cols-[160px_1fr] items-start">
                <ImageField
                  value={r.photo}
                  onChange={(photo) => set({ ...r, photo })}
                  aspect="aspect-[4/3]"
                  crop={{
                    title: 'Фото для карточки «до / после»',
                    aspects: [CROP.landscape, CROP.square, CROP.portrait],
                    previewLabel: 'Карточка в блоке «Работы учениц»',
                  }}
                />
                <div className="space-y-3">
                  <Field label="Метка">
                    <input
                      className={inputCls}
                      value={r.tag}
                      onChange={(e) => set({ ...r, tag: e.target.value })}
                      placeholder="С нуля / Повышение / Онлайн курс"
                      maxLength={120}
                    />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="До курса — каждый пункт с новой строки">
                      <LinesInput value={r.before} onChange={(before) => set({ ...r, before })} placeholder={'никогда не делала брови'} />
                    </Field>
                    <Field label="После курса — каждый пункт с новой строки">
                      <LinesInput value={r.after} onChange={(after) => set({ ...r, after })} placeholder={'освоила профессию с 0\nподняла прайс в 2 раза'} />
                    </Field>
                  </div>
                </div>
              </div>
            )}
          />
        </Card>
      )}

      {tab === 'reviews' && (
        <Card title="Отзывы учениц" hint="Пока нет ни одного отзыва, блок «Отзывы» на сайте скрыт.">
          <ListEditor<Review>
            items={content.reviews}
            onChange={(reviews) => patch({ reviews })}
            empty={{ text: '', name: '' }}
            addLabel="Добавить отзыв"
            render={(r, set) => (
              <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                <textarea
                  className={inputCls}
                  rows={3}
                  value={r.text}
                  onChange={(e) => set({ ...r, text: e.target.value })}
                  placeholder="Текст отзыва"
                  maxLength={600}
                />
                <input
                  className={inputCls}
                  value={r.name}
                  onChange={(e) => set({ ...r, name: e.target.value })}
                  placeholder="Имя, город (необязательно)"
                  maxLength={120}
                />
              </div>
            )}
          />
        </Card>
      )}

      {tab === 'faq' && (
        <Card title="Вопросы и ответы" hint="Первый вопрос на сайте открыт по умолчанию.">
          <ListEditor<FaqItem>
            items={content.faq}
            onChange={(faq) => patch({ faq })}
            empty={{ q: '', a: '' }}
            addLabel="Добавить вопрос"
            render={(f, set) => (
              <div className="space-y-3">
                <input
                  className={`${inputCls} font-semibold`}
                  value={f.q}
                  onChange={(e) => set({ ...f, q: e.target.value })}
                  placeholder="Вопрос"
                  maxLength={240}
                />
                <textarea
                  className={inputCls}
                  rows={3}
                  value={f.a}
                  onChange={(e) => set({ ...f, a: e.target.value })}
                  placeholder="Ответ"
                  maxLength={2000}
                />
              </div>
            )}
          />
        </Card>
      )}

      <DevicePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        kind="landing"
        draft={content}
        views={[
          { label: 'Этот раздел', url: `/?preview=1#${TAB_ANCHOR[tab]}` },
          { label: 'Вся главная', url: '/?preview=1' },
        ]}
      />

      {/* Панель сохранения всегда под рукой. На телефоне — над нижним меню админки (77px) */}
      <div className="fixed inset-x-0 bottom-[calc(77px+env(safe-area-inset-bottom))] z-30 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-5xl flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className={`text-center text-sm sm:text-left ${dirty ? 'font-semibold text-amber-700' : 'text-gray-600'}`}>
            {dirty ? 'Есть несохранённые изменения' : 'Все изменения сохранены'}
          </p>
          <div className="flex gap-2">
          <PreviewButton onClick={() => setPreviewOpen(true)} className="flex-1 sm:flex-none" />
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="flex flex-1 items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold disabled:opacity-50 sm:flex-none"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : dirty ? (
              <Save className="w-5 h-5" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            {saving ? 'Сохранение…' : dirty ? 'Сохранить' : 'Сохранено'}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Кирпичики редактора ────────────────────────────────────────────────────

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  // Фото с телефона по 3–4 МБ: ужимаем до 2000px — сайт и предпросмотр не тормозят
  fd.append('file', await compressImage(file));
  const res = await fetch('/api/admin/site-content/upload', {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Не удалось загрузить фото');
  return data.url as string;
}

/** Галерея фото: загрузка пачкой, подписи, перестановка, удаление. */
function GalleryEditor({
  items,
  onChange,
  crop,
  moveTo,
}: {
  items: WorkPhoto[];
  onChange: (items: WorkPhoto[]) => void;
  crop: CropOptions;
  /** Соседняя галерея того же курса («Мои работы» ↔ «Работы учениц») — перенос одним нажатием */
  moveTo?: { label: string; onMove: (item: WorkPhoto) => void };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const { cropImage, cropper } = useImageCropper();
  // Актуальный список — загрузка идёт асинхронно, а пользователь может править подписи
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const addFiles = async (picked: File[]) => {
    if (inputRef.current) inputRef.current.value = '';
    if (picked.length === 0) return;
    // Одно фото — сразу даём выбрать кадр; пачку грузим как есть, кадр можно поправить потом
    let files = picked;
    if (picked.length === 1) {
      const cropped = await cropImage(picked[0], crop);
      if (!cropped) return;
      files = [cropped];
    }
    setProgress({ done: 0, total: files.length });
    let failed = 0;
    for (const [i, file] of files.entries()) {
      try {
        const src = await uploadImage(file);
        itemsRef.current = [...itemsRef.current, { src, alt: '' }];
        onChange(itemsRef.current);
      } catch (e) {
        failed++;
        toast.error(`${file.name}: ${e instanceof Error ? e.message : 'ошибка загрузки'}`);
      }
      setProgress({ done: i + 1, total: files.length });
    }
    setProgress(null);
    if (files.length - failed > 0) toast.success(`Загружено фото: ${files.length - failed}. Не забудьте сохранить`);
  };

  const setAt = (i: number, item: WorkPhoto) => onChange(items.map((x, k) => (k === i ? item : x)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  /** Изменить кадр уже загруженного фото — режем и грузим как новое */
  const recrop = async (i: number) => {
    const old = items[i];
    const cropped = await cropImage(old.src, crop);
    if (!cropped) return;
    setBusyIdx(i);
    try {
      const src = await uploadImage(cropped);
      // Ищем по src: пока грузили, фото могли переставить
      itemsRef.current = itemsRef.current.map((x) => (x.src === old.src ? { ...x, src } : x));
      onChange(itemsRef.current);
      toast.success('Кадр обновлён. Не забудьте сохранить');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось загрузить фото');
    } finally {
      setBusyIdx(null);
    }
  };

  return (
    <div>
      {cropper}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={!!progress}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/50 py-8 text-primary-700 hover:bg-primary-50 disabled:opacity-70"
      >
        {progress ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="font-semibold">
              Загружаем {progress.done} из {progress.total}…
            </span>
          </>
        ) : (
          <>
            <ImagePlus className="w-8 h-8" />
            <span className="font-semibold">Загрузить фото</span>
            <span className="text-xs text-gray-500">JPG, PNG или WEBP до 8 МБ · можно выбрать сразу несколько</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
      />
      <button
        type="button"
        onClick={() => setLibraryOpen(true)}
        disabled={!!progress}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        <Images className="w-4 h-4" />
        Выбрать из уже загруженных
      </button>
      {libraryOpen && (
        <PhotoLibrary
          exclude={items.map((w) => w.src)}
          onClose={() => setLibraryOpen(false)}
          onPick={(srcs) => {
            onChange([...itemsRef.current, ...srcs.map((src) => ({ src, alt: '' }))]);
            setLibraryOpen(false);
            toast.success(`Добавлено фото: ${srcs.length}. Не забудьте сохранить`);
          }}
        />
      )}

      {items.length === 0 ? (
        <p className="mt-4 text-center text-sm text-gray-500">Пока нет фото — этот блок на сайте не показывается</p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((w, i) => (
            <li key={w.src} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => recrop(i)}
                disabled={busyIdx !== null}
                className="group relative block aspect-square w-full bg-gray-100"
                aria-label={`Изменить кадр фото ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.src} alt="" className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white">
                  {i + 1}
                </span>
                {busyIdx === i ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <Loader2 className="w-7 h-7 animate-spin text-primary-600" />
                  </span>
                ) : (
                  <span className="absolute inset-x-2 bottom-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-black/60 py-1.5 text-xs font-semibold text-white md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
                    <Crop className="w-3.5 h-3.5" />
                    Изменить кадр
                  </span>
                )}
              </button>
              <div className="space-y-2 p-2">
                <input
                  className="w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                  value={w.alt}
                  onChange={(e) => setAt(i, { ...w, alt: e.target.value })}
                  placeholder="Подпись (необязательно)"
                  maxLength={120}
                />
                <div className="flex justify-between">
                  <div className="flex">
                    <IconBtn label="Левее" onClick={() => move(i, -1)} disabled={i === 0}>
                      <ArrowLeft className="w-4 h-4" />
                    </IconBtn>
                    <IconBtn label="Правее" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                      <ArrowRight className="w-4 h-4" />
                    </IconBtn>
                  </div>
                  <IconBtn label="Удалить" onClick={() => onChange(items.filter((_, k) => k !== i))} danger>
                    <Trash2 className="w-4 h-4" />
                  </IconBtn>
                </div>
                {moveTo && (
                  <button
                    type="button"
                    onClick={() => moveTo.onMove(w)}
                    className="w-full rounded-lg bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                  >
                    Перенести в «{moveTo.label}»
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl p-5 md:p-6 shadow-soft border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {hint && <p className="mt-1 mb-5 text-sm text-gray-500">{hint}</p>}
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-2">{label}</span>
      {children}
    </label>
  );
}

/** Список строк в textarea: по пункту на строку. */
function LinesInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  // Держим «сырой» текст, чтобы пустая строка при наборе не пропадала
  const [text, setText] = useState(value.join('\n'));
  return (
    <textarea
      className={inputCls}
      rows={4}
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean));
      }}
    />
  );
}

function ImageField({
  label,
  value,
  onChange,
  aspect,
  crop,
}: {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  aspect: string;
  crop: CropOptions;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { cropImage, cropper } = useImageCropper();

  /** Новый файл или уже загруженное фото → выбор кадра → загрузка */
  const edit = async (src: File | string) => {
    if (inputRef.current) inputRef.current.value = '';
    const file = await cropImage(src, crop);
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось загрузить фото');
    } finally {
      setUploading(false);
    }
  };

  const pick = () => inputRef.current?.click();
  const smallBtn =
    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50';

  return (
    <div>
      {cropper}
      {label && <span className="block text-sm font-medium text-gray-700 mb-2">{label}</span>}
      <button
        type="button"
        onClick={() => (value ? edit(value) : pick())}
        disabled={uploading}
        aria-label={value ? 'Изменить кадр' : 'Загрузить фото'}
        className={`group relative w-full ${aspect} overflow-hidden rounded-xl border-2 ${
          value ? 'border-transparent' : 'border-dashed border-gray-300'
        } bg-gray-50 hover:border-primary-400`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-500">
            <ImagePlus className="w-8 h-8" />
            Загрузить фото
          </span>
        )}
        {value && !uploading && (
          <span className="absolute inset-x-0 bottom-0 inline-flex items-center justify-center gap-1.5 bg-black/55 py-1.5 text-xs font-semibold text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <Crop className="w-3.5 h-3.5" />
            Изменить кадр
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && edit(e.target.files[0])}
      />
      {value && (
        <div className="mt-2 flex flex-wrap gap-1">
          <button type="button" onClick={pick} disabled={uploading} className={`${smallBtn} text-primary-700 hover:bg-primary-50`}>
            <ImagePlus className="w-4 h-4" />
            Заменить
          </button>
          {label && (
            <button type="button" onClick={() => onChange('')} disabled={uploading} className={`${smallBtn} text-red-600 hover:bg-red-50`}>
              <Trash2 className="w-4 h-4" />
              Убрать
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ListEditor<T>({
  items,
  onChange,
  empty,
  addLabel,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  empty: T;
  addLabel: string;
  render: (item: T, set: (item: T) => void) => ReactNode;
}) {
  // Стабильные ключи для строк, чтобы поля не «прыгали» при перестановке
  const keys = useRef<number[]>([]);
  const nextKey = useRef(0);
  while (keys.current.length < items.length) keys.current.push(nextKey.current++);
  keys.current.length = items.length;

  const setAt = (i: number, item: T) => onChange(items.map((x, k) => (k === i ? item : x)));
  const removeAt = (i: number) => {
    keys.current.splice(i, 1);
    onChange(items.filter((_, k) => k !== i));
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    [keys.current[i], keys.current[j]] = [keys.current[j], keys.current[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
          Пока пусто — этот блок на сайте не показывается
        </p>
      )}
      {items.map((item, i) => (
        <div key={keys.current[i]} className="flex gap-3 rounded-xl border border-gray-200 p-4">
          <span className="mt-3 w-6 shrink-0 text-sm font-bold text-gray-400">{i + 1}</span>
          <div className="min-w-0 flex-1">{render(item, (v) => setAt(i, v))}</div>
          <div className="flex shrink-0 flex-col gap-1">
            <IconBtn label="Выше" onClick={() => move(i, -1)} disabled={i === 0}>
              <ArrowUp className="w-4 h-4" />
            </IconBtn>
            <IconBtn label="Ниже" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
              <ArrowDown className="w-4 h-4" />
            </IconBtn>
            <IconBtn label="Удалить" onClick={() => removeAt(i)} danger>
              <Trash2 className="w-4 h-4" />
            </IconBtn>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, empty])}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary-200 py-3 text-sm font-semibold text-primary-700 hover:bg-primary-50"
      >
        <Plus className="w-4 h-4" />
        {addLabel}
      </button>
    </div>
  );
}

type LibraryPhoto = { src: string; uploadedAt: string; used: boolean };

/**
 * Все загруженные для главной фото. Сверху — те, что нигде не стоят
 * (загрузили, но не сохранили или убрали из галереи), их можно вернуть без повторной загрузки.
 */
function PhotoLibrary({
  exclude,
  onPick,
  onClose,
}: {
  exclude: string[];
  onPick: (srcs: string[]) => void;
  onClose: () => void;
}) {
  const [photos, setPhotos] = useState<LibraryPhoto[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [onlyFree, setOnlyFree] = useState(true);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/admin/site-content/library', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setPhotos(d.photos))
      .catch(() => setFailed(true));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const list = (photos ?? []).filter((p) => !exclude.includes(p.src) && (!onlyFree || !p.used));
  const toggle = (src: string) =>
    setPicked((cur) => (cur.includes(src) ? cur.filter((x) => x !== src) : [...cur, src]));
  const day = (iso: string) =>
    new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Загруженные фото" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-t-2xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Уже загруженные фото</h2>
            <p className="mt-1 text-sm text-gray-500">Отметьте нужные — они добавятся в эту галерею в порядке выбора.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">
            Закрыть
          </button>
        </div>
        <label className="flex items-center gap-2 px-5 pt-4 text-sm text-gray-700">
          <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} className="h-4 w-4" />
          Только те, что сейчас нигде не стоят на сайте
        </label>
        <div className="flex-1 overflow-y-auto p-5">
          {failed ? (
            <p className="text-sm text-red-600">Не удалось загрузить список фото</p>
          ) : !photos ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
          ) : list.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              {onlyFree ? 'Свободных фото нет — все загруженные уже стоят на сайте.' : 'Фото пока нет.'}
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {list.map((p) => {
                const n = picked.indexOf(p.src);
                return (
                  <li key={p.src}>
                    <button
                      type="button"
                      onClick={() => toggle(p.src)}
                      aria-pressed={n >= 0}
                      className={`relative block aspect-square w-full overflow-hidden rounded-xl bg-gray-100 ring-offset-2 ${n >= 0 ? 'ring-4 ring-primary-500' : 'hover:opacity-90'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.src} alt="" loading="lazy" className="h-full w-full object-cover" />
                      {n >= 0 && (
                        <span className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                          {n + 1}
                        </span>
                      )}
                      {p.used && (
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">на сайте</span>
                      )}
                    </button>
                    <p className="mt-1 text-center text-[11px] text-gray-500">{day(p.uploadedAt)}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 p-4">
          <span className="text-sm text-gray-600">Выбрано: {picked.length}</span>
          <button
            type="button"
            onClick={() => onPick(picked)}
            disabled={picked.length === 0}
            className="rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            Добавить в галерею
          </button>
        </div>
      </div>
    </div>
  );
}

/** Подсказка, почему блок может быть не виден на сайте, даже если он включён. */
function blockEmptyHint(c: LandingContentData, tab: CourseTabId, id: BlockState['id']): string | null {
  const brow = tab === 'brow';
  switch (id) {
    case 'facts':
      return c.authorFacts.length ? null : 'нет карточек — добавьте во вкладке «Натуральный перманент»';
    case 'steps':
      return c.steps.length ? null : 'нет шагов — добавьте во вкладке «Натуральный перманент»';
    case 'myWorks':
      return (brow ? c.browAuthorWorks : c.authorWorks).length ? null : 'нет фото — загрузите в «МОИ работы»';
    case 'studentWorks':
      return (brow ? c.browWorks : c.works).length || (!brow && c.results.length) ? null : 'нет фото — загрузите в «работы УЧЕНИЦ»';
    case 'modules':
      return null;
    case 'price':
      return null;
  }
}

/** Порядок и видимость блоков вкладки. */
function BlocksEditor({
  items,
  onChange,
  emptyHint,
}: {
  items: BlockState[];
  onChange: (items: BlockState[]) => void;
  emptyHint: (id: BlockState['id']) => string | null;
}) {
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <ol className="space-y-2">
      {items.map((b, i) => {
        const hint = emptyHint(b.id);
        return (
          <li
            key={b.id}
            className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border p-3 sm:flex-nowrap ${b.hidden ? 'border-dashed border-gray-300 bg-gray-50' : 'border-gray-200 bg-white'}`}
          >
            <span className="w-6 shrink-0 text-center text-sm font-bold text-gray-400">{i + 1}</span>
            {/* На телефоне кнопки уходят под название, чтобы оно не сжималось в столбик */}
            <div className="min-w-0 flex-1 basis-[calc(100%-3rem)] sm:basis-auto">
              <p className={`font-semibold ${b.hidden ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{BLOCK_NAMES[b.id]}</p>
              {b.hidden ? (
                <p className="text-xs text-gray-500">скрыт на сайте</p>
              ) : (
                hint && <p className="text-xs text-amber-700">на сайте не виден: {hint}</p>
              )}
            </div>
            <div className="ml-9 flex shrink-0 items-center gap-1 sm:ml-0">
              <IconBtn label="Выше" onClick={() => move(i, -1)} disabled={i === 0}>
                <ArrowUp className="w-4 h-4" />
              </IconBtn>
              <IconBtn label="Ниже" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                <ArrowDown className="w-4 h-4" />
              </IconBtn>
              <button
                type="button"
                onClick={() => onChange(items.map((x, k) => (k === i ? { ...x, hidden: !x.hidden } : x)))}
                aria-pressed={!b.hidden}
                className={`ml-1 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${
                  b.hidden ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                }`}
              >
                {b.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {b.hidden ? 'Скрыт' : 'Виден'}
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Toggle({ label, note, on, onChange }: { label: string; note?: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-200 p-4">
      <span>
        <span className="block font-semibold text-gray-900">{label}</span>
        {note && <span className="text-xs text-gray-500">{note}</span>}
      </span>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-primary-600" />
    </label>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}
