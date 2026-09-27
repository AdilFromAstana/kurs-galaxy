'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
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
import type {
  AuthorFact,
  FaqItem,
  LandingContentData,
  ResultCard,
  Review,
  WorkPhoto,
} from '@/lib/landingContent';

const TABS = [
  { id: 'author', name: 'Об авторе', icon: User },
  { id: 'works', name: 'Работы учениц', icon: Images },
  { id: 'results', name: 'Результаты', icon: Sparkles },
  { id: 'reviews', name: 'Отзывы', icon: MessageSquare },
  { id: 'faq', name: 'Вопросы', icon: HelpCircle },
] as const;
type TabId = (typeof TABS)[number]['id'];

const inputCls =
  'w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

export default function LandingContentPage() {
  const [content, setContent] = useState<LandingContentData | null>(null);
  const [tab, setTab] = useState<TabId>('author');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/site-content', { credentials: 'include' });
      if (res.ok) setContent((await res.json()).content);
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

  const save = async () => {
    if (!content) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/site-content', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Не удалось сохранить');
      setContent(data.content);
      setDirty(false);
      toast.success('Сохранено — изменения уже на сайте');
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
    <div className="space-y-6 animate-fade-in pb-28 max-w-5xl">
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
          hint="Блок идёт на главной сразу после первого экрана. Если не заполнены ни имя, ни фото — блок скрыт."
        >
          <div className="grid gap-6 md:grid-cols-[240px_1fr]">
            <ImageField
              label="Фото"
              value={content.authorPhoto}
              onChange={(v) => patch({ authorPhoto: v })}
              aspect="aspect-[4/5]"
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

          <h3 className="mt-8 mb-3 font-bold text-gray-900">Факты о вас</h3>
          <ListEditor<AuthorFact>
            items={content.authorFacts}
            onChange={(authorFacts) => patch({ authorFacts })}
            empty={{ title: '', text: '' }}
            addLabel="Добавить факт"
            render={(f, set) => (
              <div className="grid gap-3 md:grid-cols-[200px_1fr]">
                <input
                  className={inputCls}
                  value={f.title}
                  onChange={(e) => set({ ...f, title: e.target.value })}
                  placeholder="Заголовок: Опыт"
                  maxLength={120}
                />
                <textarea
                  className={inputCls}
                  rows={2}
                  value={f.text}
                  onChange={(e) => set({ ...f, text: e.target.value })}
                  placeholder="Текст: 7 лет в профессии, средний чек 15 000 ₸"
                  maxLength={600}
                />
              </div>
            )}
          />
        </Card>
      )}

      {tab === 'works' && (
        <Card
          title="Работы учениц — карусель фото"
          hint="Фото «до/после» в карусели блока «Работы учениц». Лучше квадратные или вертикальные."
        >
          <ListEditor<WorkPhoto>
            items={content.works}
            onChange={(works) => patch({ works })}
            empty={{ src: '', alt: '' }}
            addLabel="Добавить фото"
            render={(w, set) => (
              <div className="grid gap-4 sm:grid-cols-[160px_1fr] items-start">
                <ImageField value={w.src} onChange={(src) => set({ ...w, src })} aspect="aspect-square" />
                <Field label="Подпись к фото (для незрячих и поисковиков)">
                  <input
                    className={inputCls}
                    value={w.alt}
                    onChange={(e) => set({ ...w, alt: e.target.value })}
                    placeholder="Брови хной до и после"
                    maxLength={120}
                  />
                </Field>
              </div>
            )}
          />
        </Card>
      )}

      {tab === 'results' && (
        <Card
          title="Результаты учениц — карточки «до / после»"
          hint="Карточки под каруселью: фото ученицы и что изменилось после курса. Карточка без фото не сохранится."
        >
          <ListEditor<ResultCard>
            items={content.results}
            onChange={(results) => patch({ results })}
            empty={{ photo: '', tag: '', before: [], after: [] }}
            addLabel="Добавить карточку"
            render={(r, set) => (
              <div className="grid gap-4 sm:grid-cols-[160px_1fr] items-start">
                <ImageField value={r.photo} onChange={(photo) => set({ ...r, photo })} aspect="aspect-[4/5]" />
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

      {/* Панель сохранения всегда под рукой */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            {dirty ? 'Есть несохранённые изменения' : 'Все изменения сохранены'}
          </p>
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold disabled:opacity-50"
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
  );
}

// ─── Кирпичики редактора ────────────────────────────────────────────────────

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
}: {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  aspect: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/site-content/upload', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Не удалось загрузить фото');
      onChange(data.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось загрузить фото');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      {label && <span className="block text-sm font-medium text-gray-700 mb-2">{label}</span>}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`group relative w-full ${aspect} overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-primary-400`}
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
          <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1.5 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">
            Заменить фото
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
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      {value && label && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="mt-2 text-sm text-red-600 hover:underline"
        >
          Убрать фото
        </button>
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
