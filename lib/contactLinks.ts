// Ссылки на мессенджеры из того, что вписали в админке. Автор может ввести
// номер «+7 708 855 64 04», ник «@kamila» или готовую ссылку — всё должно работать.

const SITE_GREETING = 'Здравствуйте! Пишу с сайта KursGalaxy.kz';

/** wa.me/<цифры> с готовым текстом — человек сразу попадает в чат и может писать. */
export function whatsappHref(value: string | null | undefined, text = SITE_GREETING): string | null {
  const v = (value ?? '').trim();
  if (!v) return null;
  let digits = '';
  const m = v.match(/wa\.me\/(\d+)/i) ?? v.match(/[?&]phone=(\d+)/i);
  if (m) digits = m[1];
  else if (!/^https?:\/\//i.test(v)) digits = v.replace(/\D/g, '');
  // Казахстанский номер, начатый с 8: 8 708… → 7 708…
  if (/^8\d{10}$/.test(digits)) digits = '7' + digits.slice(1);
  if (!digits) return /^https?:\/\//i.test(v) ? v : null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/** Номер для подписи: +7 708 855 64 04. */
export function whatsappLabel(value: string | null | undefined): string {
  const href = whatsappHref(value, '');
  const d = href?.match(/wa\.me\/(\d+)/)?.[1] ?? '';
  if (/^7\d{10}$/.test(d)) return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;
  return d ? `+${d}` : (value ?? '');
}

export function telegramHref(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://t.me/${v.replace(/^@/, '').replace(/^t\.me\//i, '')}`;
}

export function instagramHref(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://instagram.com/${v.replace(/^@/, '').replace(/^(www\.)?instagram\.com\//i, '')}`;
}
