'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, Copy, KeyRound, Loader2, Plus, UserX, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';

// Доступ к курсу по ссылке: автор создаёт ссылку на конкретный курс и отправляет человеку.
// Тот входит/регистрируется и получает доступ только к этому курсу. Здесь же видно,
// кто активировал, и можно закрыть доступ человеку или отключить ссылку.

type CourseOpt = { id: string; title: string; isFree: boolean; published: boolean };
type LinkPurchase = {
  id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
};
type AccessLinkDTO = {
  id: string;
  token: string;
  note: string | null;
  accessDays: number | null;
  maxUses: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
  course: CourseOpt;
  purchases: LinkPurchase[];
};

const inputCls =
  'w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

const DAY_OPTIONS = [
  { v: '', label: 'Бессрочно' },
  { v: '30', label: '1 месяц' },
  { v: '60', label: '2 месяца' },
  { v: '90', label: '3 месяца' },
  { v: '180', label: '6 месяцев' },
  { v: '365', label: '1 год' },
];

const USE_OPTIONS = [
  { v: '1', label: 'Одному человеку (ссылка сработает один раз)' },
  { v: '0', label: 'Группе — без ограничения' },
  { v: '5', label: 'До 5 человек' },
  { v: '10', label: 'До 10 человек' },
  { v: '30', label: 'До 30 человек' },
];

const fmt = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

function personStatus(p: LinkPurchase): { text: string; open: boolean } {
  if (p.status === 'CANCELLED') return { text: 'доступ закрыт', open: false };
  if (p.expiresAt && new Date(p.expiresAt) < new Date()) return { text: `срок истёк ${fmt(p.expiresAt)}`, open: false };
  return { text: p.expiresAt ? `доступ до ${fmt(p.expiresAt)}` : 'доступ бессрочно', open: true };
}

export default function AccessLinksPage() {
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [links, setLinks] = useState<AccessLinkDTO[] | null>(null);
  const [form, setForm] = useState({ courseId: '', note: '', accessDays: '', maxUses: '1' });
  const [creating, setCreating] = useState(false);
  const [fresh, setFresh] = useState<AccessLinkDTO | null>(null);
  const [origin, setOrigin] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/access-links', { credentials: 'include' });
    if (res.ok) setLinks((await res.json()).links);
    else setLinks([]);
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch('/api/admin/courses', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { courses: [] }))
      .then((d) => setCourses(d.courses ?? []))
      .catch(() => {});
    load();
  }, [load]);

  const url = (token: string) => `${origin}/access/${token}`;
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Ссылка скопирована');
    } catch {
      toast.error('Не получилось скопировать — выделите ссылку вручную');
    }
  };
  const shareWa = (token: string, courseTitle: string) =>
    `https://wa.me/?text=${encodeURIComponent(`Ваш доступ к курсу «${courseTitle}»: ${url(token)}`)}`;

  const selected = courses.find((c) => c.id === form.courseId);

  const create = async () => {
    if (!form.courseId) {
      toast.error('Выберите курс');
      return;
    }
    setCreating(true);
    const res = await fetch('/api/admin/access-links', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: form.courseId,
        note: form.note,
        accessDays: form.accessDays ? Number(form.accessDays) : null,
        maxUses: Number(form.maxUses),
      }),
    });
    setCreating(false);
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).message ?? 'Не удалось создать ссылку');
      return;
    }
    await load();
    const { link } = await res.json().catch(() => ({ link: null }));
    if (link) {
      setFresh({ ...link, course: selected!, purchases: [] });
      copy(url(link.token));
    }
    setForm((f) => ({ ...f, note: '' }));
  };

  const setLinkActive = async (id: string, active: boolean) => {
    const res = await fetch(`/api/admin/access-links/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    if (!res.ok) return toast.error('Не удалось');
    toast.success(active ? 'Ссылка снова работает' : 'Ссылка отключена');
    load();
  };

  const setPersonAccess = async (p: LinkPurchase, open: boolean) => {
    if (!open && !confirm(`Закрыть доступ к курсу для ${p.user.name || p.user.email}?`)) return;
    const res = await fetch(`/api/admin/purchases/${p.id}`, {
      method: open ? 'PATCH' : 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: open ? JSON.stringify({ status: 'ACTIVE' }) : undefined,
    });
    if (!res.ok) return toast.error('Не удалось');
    toast.success(open ? 'Доступ снова открыт' : 'Доступ закрыт');
    load();
  };

  return (
    <div className="max-w-5xl space-y-6 pb-28 animate-fade-in">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 md:text-3xl">
          <KeyRound className="h-8 w-8 text-primary-600" />
          Доступ по ссылке
        </h1>
        <p className="mt-1 text-sm text-gray-600 md:text-base">
          Создайте ссылку на курс и отправьте человеку. Он зарегистрируется или войдёт — и получит доступ
          только к этому курсу. Закрыть доступ можно в любой момент ниже.
        </p>
      </div>

      {/* ── Новая ссылка ── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft md:p-6">
        <h2 className="text-lg font-bold text-gray-900">Новая ссылка</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Курс</span>
            <select className={inputCls} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">— выберите курс —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                  {c.published ? '' : ' (не опубликован)'}
                </option>
              ))}
            </select>
          </label>
          {selected?.isFree && (
            <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 md:col-span-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>
                Этот курс сейчас <b>бесплатный</b> — его уроки открыты всем зарегистрированным, ссылка ничего не
                ограничит. Чтобы курс открывался только по ссылке, выключите «Бесплатный курс» в{' '}
                <Link href={`/admin/courses/${selected.id}/edit`} className="font-semibold underline">
                  настройках курса
                </Link>
                .
              </p>
            </div>
          )}
          {selected && !selected.published && (
            <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 md:col-span-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>Курс не опубликован — по ссылке он не откроется, пока вы его не опубликуете.</p>
            </div>
          )}
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Для кого (видите только вы)</span>
            <input
              className={inputCls}
              value={form.note}
              maxLength={200}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Например: Айгерим, оплатила на Каспи 7 октября"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Срок доступа после активации</span>
            <select className={inputCls} value={form.accessDays} onChange={(e) => setForm({ ...form, accessDays: e.target.value })}>
              {DAY_OPTIONS.map((o) => (
                <option key={o.v} value={o.v}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Сколько человек может открыть</span>
            <select className={inputCls} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })}>
              {USE_OPTIONS.map((o) => (
                <option key={o.v} value={o.v}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={create}
          disabled={creating || !form.courseId}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700 disabled:opacity-50 md:w-auto"
        >
          {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          Создать ссылку
        </button>

        {fresh && (
          <div className="mt-5 rounded-xl border-2 border-green-200 bg-green-50 p-4">
            <p className="flex items-center gap-2 font-semibold text-green-800">
              <Check className="h-5 w-5" /> Ссылка готова и скопирована — отправьте её человеку
            </p>
            <p className="mt-2 break-all rounded-lg bg-white px-3 py-2 font-mono text-sm text-gray-800">{url(fresh.token)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => copy(url(fresh.token))} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-800 ring-1 ring-gray-200 hover:bg-gray-50">
                <Copy className="h-4 w-4" /> Скопировать
              </button>
              <a href={shareWa(fresh.token, fresh.course.title)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white">
                <WhatsAppIcon className="h-4 w-4" /> Отправить в WhatsApp
              </a>
            </div>
          </div>
        )}
      </section>

      {/* ── Список ссылок ── */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900">Ссылки и кто по ним вошёл</h2>
        {!links ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
        ) : links.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
            Пока ни одной ссылки. Создайте первую выше.
          </p>
        ) : (
          <ul className="space-y-3">
            {links.map((l) => {
              const usedUp = l.maxUses > 0 && l.usedCount >= l.maxUses;
              const state = !l.active ? 'отключена' : usedUp ? 'использована' : 'работает';
              return (
                <li key={l.id} className={`rounded-2xl border bg-white p-4 md:p-5 ${l.active ? 'border-gray-100' : 'border-dashed border-gray-300 opacity-80'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">{l.course.title}</p>
                      {l.note && <p className="text-sm text-gray-700">{l.note}</p>}
                      <p className="mt-1 text-xs text-gray-500">
                        создана {fmt(l.createdAt)} ·{' '}
                        {l.accessDays ? `доступ на ${l.accessDays} дн.` : 'бессрочно'} · активировали {l.usedCount}
                        {l.maxUses > 0 ? ` из ${l.maxUses}` : ''} ·{' '}
                        <span className={state === 'работает' ? 'font-semibold text-green-700' : 'font-semibold text-gray-600'}>{state}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {l.active && !usedUp && (
                        <>
                          <button type="button" onClick={() => copy(url(l.token))} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100">
                            <Copy className="h-4 w-4" /> Ссылка
                          </button>
                          <a href={shareWa(l.token, l.course.title)} target="_blank" rel="noopener noreferrer" aria-label="Отправить в WhatsApp" className="inline-flex items-center rounded-lg bg-[#25D366]/10 px-3 py-2 text-[#128C4B] hover:bg-[#25D366]/20">
                            <WhatsAppIcon className="h-4 w-4" />
                          </a>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setLinkActive(l.id, !l.active)}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                      >
                        {l.active ? 'Отключить ссылку' : 'Включить ссылку'}
                      </button>
                    </div>
                  </div>

                  {l.purchases.length > 0 && (
                    <ul className="mt-3 divide-y divide-gray-100 rounded-xl bg-gray-50">
                      {l.purchases.map((p) => {
                        const st = personStatus(p);
                        return (
                          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                            <div className="min-w-0">
                              <Link href={`/admin/students/${p.user.id}`} className="font-medium text-gray-900 hover:underline">
                                {p.user.name || p.user.email}
                              </Link>
                              <p className="text-xs text-gray-500">
                                {p.user.email} · вошла {fmt(p.createdAt)} ·{' '}
                                <span className={st.open ? 'text-green-700' : 'text-red-600'}>{st.text}</span>
                              </p>
                            </div>
                            {p.status === 'CANCELLED' ? (
                              <button type="button" onClick={() => setPersonAccess(p, true)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50">
                                <UserCheck className="h-4 w-4" /> Вернуть доступ
                              </button>
                            ) : (
                              <button type="button" onClick={() => setPersonAccess(p, false)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                                <UserX className="h-4 w-4" /> Закрыть доступ
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
