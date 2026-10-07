import type { Metadata } from "next";
import LinksPage from "@/components/landing/LinksPage";
import { DEFAULT_TEXTS, loadLandingContent } from "@/lib/landingContent";

// Одна ссылка для профиля Instagram — внутри кнопки на оба курса
export async function generateMetadata(): Promise<Metadata> {
  let texts = DEFAULT_TEXTS;
  let photo = "/landing/author.jpg";
  let name = "";
  if (process.env.DATABASE_URL) {
    try {
      const c = await loadLandingContent();
      texts = c.texts;
      photo = c.authorPhoto || photo;
      name = c.authorName;
    } catch {
      /* тексты по умолчанию */
    }
  }
  const title = `${name ? `${name} — ` : ""}${texts.tabBrow} и ${texts.tabPermanent}`;
  return { title, description: texts.seoDescription, openGraph: { title, description: texts.seoDescription, images: [photo] } };
}

export default function Page() {
  return <LinksPage />;
}
