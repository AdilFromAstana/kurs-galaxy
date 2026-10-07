import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Бровист с 0 и натуральный перманент — KursGalaxy.kz",
  description:
    "Курсы Камилы Нуртаевой: «Бровист с 0» онлайн — брови хной и краской, колористика; «Натуральный перманент» — онлайн-подготовка и практика на моделях",
};

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
