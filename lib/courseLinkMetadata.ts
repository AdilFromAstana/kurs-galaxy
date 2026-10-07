import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { DEFAULT_TEXTS, loadLandingContent } from '@/lib/landingContent';

// Превью страниц, которыми делятся (главная, /links, /brow, /permanent): заголовок,
// описание и фото автора — во вкладке браузера, Instagram, WhatsApp, Telegram.
// Считается при каждом запросе: тексты из админки сразу, а адрес картинки —
// полный URL от домена, с которого открыли (сборка о домене не знает).

function requestOrigin(): URL | undefined {
  try {
    const h = headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    if (host) return new URL(`${h.get('x-forwarded-proto') ?? 'https'}://${host}`);
  } catch {
    /* вне запроса */
  }
  try {
    return process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined;
  } catch {
    return undefined;
  }
}

export type SharePage = 'home' | 'links' | 'brow' | 'permanent';

export async function shareMetadata(page: SharePage): Promise<Metadata> {
  let texts = DEFAULT_TEXTS;
  let photo = '/landing/author.jpg';
  let name = '';
  try {
    const c = await loadLandingContent();
    texts = c.texts;
    photo = c.authorPhoto || photo;
    name = c.authorName;
  } catch {
    /* БД недоступна — тексты по умолчанию */
  }
  const title =
    page === 'home'
      ? texts.seoTitle
      : page === 'links'
        ? `${name ? `${name} — ` : ''}${texts.tabBrow} и ${texts.tabPermanent}`
        : `${page === 'brow' ? texts.tabBrow : texts.tabPermanent} — ${texts.siteName}`;
  // Полный адрес картинки собираем сами: metadataBase из корневого layout перекрыл бы домен запроса
  const origin = requestOrigin();
  const image = origin ? new URL(photo, origin).toString() : photo;
  return {
    title,
    description: texts.seoDescription,
    openGraph: { title, description: texts.seoDescription, images: [image], type: 'website' },
  };
}
