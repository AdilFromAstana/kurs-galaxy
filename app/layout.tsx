import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";
import { DEFAULT_TEXTS, loadLandingContent } from "@/lib/landingContent";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

// Название вкладки браузера и описание для поиска — из админки («Тексты и кнопки» → «Сайт целиком»).
// Страницы пересобираются раз в 5 минут, так что правка доходит до них без деплоя.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const fallback = { title: DEFAULT_TEXTS.seoTitle, description: DEFAULT_TEXTS.seoDescription };
  // Сборка идёт без БД (прод собирается локально) — не пытаемся к ней ходить
  if (!process.env.DATABASE_URL) return fallback;
  try {
    const { texts } = await loadLandingContent();
    return { title: texts.seoTitle, description: texts.seoDescription };
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
