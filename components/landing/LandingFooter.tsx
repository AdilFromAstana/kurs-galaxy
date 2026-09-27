'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2, Instagram, Loader2, MessageCircle, Send } from 'lucide-react';
import { hasSection, sectionFromHref, useLandingContent } from '@/hooks/useLandingContent';

interface PublicSiteSettings {
  contactPhone: string | null;
  contactEmail: string | null;
  contactWhatsapp: string | null;
  contactTelegram: string | null;
  contactInstagram: string | null;
  legalEntityName: string | null;
  legalRequisites: string | null;
  legalAddress: string | null;
}

const EMPTY: PublicSiteSettings = {
  contactPhone: null,
  contactEmail: null,
  contactWhatsapp: null,
  contactTelegram: null,
  contactInstagram: null,
  legalEntityName: null,
  legalRequisites: null,
  legalAddress: null,
};

const MENU = [
  { href: '/#author', label: 'Об авторе' },
  { href: '/#my-works', label: 'Мои работы' },
  { href: '/#for-whom', label: 'Почему наши курсы' },
  { href: '/#results', label: 'Работы учениц' },
  { href: '/#reviews', label: 'Отзывы' },
  { href: '/#courses', label: 'Курсы' },
  { href: '/#faq', label: 'Вопрос / ответ' },
];

const LEGAL = [
  { href: '/legal/offer', label: 'Договор-оферта' },
  { href: '/legal/privacy', label: 'Политика конфиденциальности' },
  { href: '/legal/refund', label: 'Условия возврата' },
  { href: '/legal/contacts', label: 'Контакты' },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60';

/** Маска +7 (000) 000-00-00 — для казахстанских/российских номеров. */
function formatPhone(raw: string) {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (d && !d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  const p = d.slice(1);
  let out = '+7';
  if (p.length > 0) out += ` (${p.slice(0, 3)}`;
  if (p.length >= 3) out += ')';
  if (p.length > 3) out += ` ${p.slice(3, 6)}`;
  if (p.length > 6) out += `-${p.slice(6, 8)}`;
  if (p.length > 8) out += `-${p.slice(8, 10)}`;
  return out;
}

function ContactCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[132px] flex-col justify-between rounded-3xl bg-white p-6">
      <p className="text-sm font-semibold text-landing-plum/70">{label}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function LeadForm() {
  const id = useId();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError('Укажите имя');
    if (phone.replace(/\D/g, '').length < 11) return setError('Укажите номер телефона полностью');
    if (!consent) return setError('Нужно согласие на обработку персональных данных');

    setStatus('sending');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, consent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Не удалось отправить заявку');
      setStatus('done');
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : 'Не удалось отправить заявку');
    }
  };

  if (status === 'done') {
    return (
      <div
        className="flex items-center gap-4 rounded-3xl bg-white/15 p-6 ring-1 ring-white/30"
        role="status"
      >
        <CheckCircle2 className="h-10 w-10 shrink-0 text-white" aria-hidden />
        <div>
          <p className="text-lg font-bold text-white">Заявка отправлена!</p>
          <p className="text-sm text-white/85">Мы свяжемся с вами в ближайшее время.</p>
        </div>
      </div>
    );
  }

  const inputCls = `h-14 w-full rounded-2xl border-2 border-white/40 bg-white/10 px-5 text-base text-white placeholder:text-white/70 transition-colors hover:border-white/70 focus:border-white focus:bg-white/15 ${focusRing}`;

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label htmlFor={`${id}-name`} className="sr-only">
          Имя
        </label>
        <input
          id={`${id}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя"
          autoComplete="name"
          maxLength={80}
          className={inputCls}
        />
        <label htmlFor={`${id}-phone`} className="sr-only">
          Телефон
        </label>
        <input
          id={`${id}-phone`}
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          onFocus={() => !phone && setPhone('+7')}
          placeholder="+7 (000) 000-00-00"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className={inputCls}
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className={`inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-base font-bold text-landing-pink transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 motion-reduce:transform-none ${focusRing}`}
        >
          {status === 'sending' && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          Отправить
        </button>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-white/90">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-2 border-white/70 bg-transparent accent-white"
        />
        <span>
          Соглашаюсь с{' '}
          <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-white">
            политикой конфиденциальности
          </Link>{' '}
          и даю согласие на обработку персональных данных
        </span>
      </label>

      <p className="mt-3 min-h-[1.25rem] text-sm font-semibold text-white" role="alert" aria-live="polite">
        {error}
      </p>
    </form>
  );
}

export default function LandingFooter() {
  const [s, setS] = useState<PublicSiteSettings>(EMPTY);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/api/site-settings/public');
        if (!cancel && res.ok) {
          const data = await res.json();
          setS(data.settings ?? EMPTY);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const socials = [
    s.contactTelegram && { href: s.contactTelegram, label: 'Telegram', icon: Send },
    s.contactInstagram && { href: s.contactInstagram, label: 'Instagram', icon: Instagram },
    s.contactWhatsapp && { href: s.contactWhatsapp, label: 'WhatsApp', icon: MessageCircle },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Send }[];

  const landing = useLandingContent();
  const menu = MENU.filter((m) => {
    const section = sectionFromHref(m.href);
    return !section || hasSection(landing, section);
  });

  const hasContacts = s.contactPhone || s.contactEmail || socials.length > 0;
  const year = new Date().getFullYear();

  return (
    <footer
      id="contacts"
      className="relative overflow-hidden bg-gradient-to-br from-landing-pink via-[#e8509f] to-landing-pink-dark text-white"
    >
      <div className="pointer-events-none absolute -right-40 top-10 h-[30rem] w-[30rem] rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-40 h-80 w-80 rounded-full bg-landing-plum/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pt-16 md:px-6 md:pt-24 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
          {/* Контакты */}
          <div className="flex flex-col gap-4 text-landing-plum">
            {s.contactPhone && (
              <ContactCard label="телефон">
                <a
                  href={`tel:${s.contactPhone.replace(/[^+\d]/g, '')}`}
                  className="text-2xl font-bold text-landing-pink hover:underline"
                >
                  {s.contactPhone}
                </a>
              </ContactCard>
            )}
            {s.contactEmail && (
              <ContactCard label="email">
                <a
                  href={`mailto:${s.contactEmail}`}
                  className="break-all text-xl font-bold text-landing-pink hover:underline"
                >
                  {s.contactEmail}
                </a>
              </ContactCard>
            )}
            {socials.length > 0 && (
              <ContactCard label="соц. сети">
                <div className="flex gap-3">
                  {socials.map(({ href, label, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-landing-pink text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-landing-pink/40"
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </a>
                  ))}
                </div>
              </ContactCard>
            )}
            {!hasContacts && (
              <ContactCard label="контакты">
                <p className="text-base font-semibold">
                  Оставьте заявку — мы перезвоним и ответим на все вопросы
                </p>
              </ContactCard>
            )}
          </div>

          {/* Меню + форма */}
          <div className="flex flex-col gap-12">
            <nav aria-label="Меню подвала" className="grid gap-8 sm:grid-cols-2">
              <div>
                <p className="mb-4 text-2xl font-extrabold uppercase">Меню</p>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-1">
                  {menu.map((m) => (
                    <li key={m.href}>
                      <a
                        href={m.href}
                        className={`inline-block rounded py-1 text-white/90 transition-colors hover:text-white hover:underline ${focusRing}`}
                      >
                        {m.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <ul className="space-y-2 sm:pt-12 sm:text-right">
                {LEGAL.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={`inline-block rounded py-1 text-white/90 transition-colors hover:text-white hover:underline ${focusRing}`}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <p className="text-2xl md:text-3xl font-extrabold">Остались вопросы?</p>
              <p className="mb-6 mt-2 text-white/90">
                Оставьте заявку, и мы свяжемся с вами
              </p>
              <LeadForm />
            </div>
          </div>
        </div>

        {/* Бренд */}
        <p
          className="mt-16 select-none text-center font-extrabold lowercase leading-none tracking-tighter text-white md:mt-24"
          style={{ fontSize: 'clamp(2.25rem, 10.5vw, 9.5rem)' }}
          aria-hidden
        >
          kursgalaxy.kz
        </p>

        <div className="flex flex-col gap-2 border-t border-white/25 py-6 text-xs text-white/85 md:flex-row md:items-center md:justify-between">
          <p>© {year} KursGalaxy.kz</p>
          {s.legalEntityName && <p>{s.legalEntityName}</p>}
          {s.legalRequisites && <p>ИИН/БИН {s.legalRequisites}</p>}
          {s.legalAddress && <p>{s.legalAddress}</p>}
        </div>
      </div>
    </footer>
  );
}
