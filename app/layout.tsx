import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";
import { DEFAULT_TEXTS, loadLandingContent } from "@/lib/landingContent";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

// Название вкладки браузера и описание для поиска — из админки («Тексты и кнопки» → «Сайт целиком»).
// Страницы собираются при запросе: так правка видна сразу. Пересборка по таймеру (ISR) не годится —
// на сервере папка приложения только для чтения, и Next не может сохранить обновлённую страницу.
export const dynamic = 'force-dynamic';

// Адрес сайта — чтобы картинка превью ссылки была полным URL (Instagram, WhatsApp, Telegram)
function siteUrl(): URL | undefined {
  try {
    return process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined;
  } catch {
    return undefined;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const base = { metadataBase: siteUrl() };
  const fallback = { ...base, title: DEFAULT_TEXTS.seoTitle, description: DEFAULT_TEXTS.seoDescription };
  // Сборка идёт без БД (прод собирается локально) — не пытаемся к ней ходить
  if (!process.env.DATABASE_URL) return fallback;
  try {
    // Превью с фото — у страниц, которыми делятся (lib/courseLinkMetadata), там же полный адрес картинки
    const { texts } = await loadLandingContent();
    return { ...base, title: texts.seoTitle, description: texts.seoDescription };
  } catch {
    return fallback;
  }
}

// Next 14 ждёт viewport/themeColor отдельным экспортом (в metadata — предупреждение
// в логах на каждый запрос). Масштабирование не запрещаем — людям нужно приближать фото.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ec4899",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
