import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'KursGalaxy.kz - Профессиональные онлайн-курсы',
  description: 'Получите доступ к качественным онлайн-курсам и станьте профессионалом в своей области',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#ec4899',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
