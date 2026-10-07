import type { Metadata } from 'next';
import { DEFAULT_TEXTS, loadLandingContent } from '@/lib/landingContent';

// Превью отдельной ссылки курса (/brow, /permanent): так она выглядит во вкладке
// браузера, в Instagram и при пересылке в мессенджерах. Тексты — из админки.
export async function courseLinkMetadata(tab: 'brow' | 'permanent'): Promise<Metadata> {
  let texts = DEFAULT_TEXTS;
  let photo = '/landing/author.jpg';
  if (process.env.DATABASE_URL) {
    try {
      const c = await loadLandingContent();
      texts = c.texts;
      photo = c.authorPhoto || photo;
    } catch {
      /* тексты по умолчанию */
    }
  }
  const name = tab === 'brow' ? texts.tabBrow : texts.tabPermanent;
  const title = `${name} — ${texts.siteName}`;
  return {
    title,
    description: texts.seoDescription,
    openGraph: { title, description: texts.seoDescription, images: [photo], type: 'website' },
  };
}
