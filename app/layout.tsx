import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Курсы по бровям — KursGalaxy.kz",
  description:
    "Онлайн-курсы для бровистов: натуральные брови хной и краской, колористика и перманент — с нуля до высокого чека",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
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
