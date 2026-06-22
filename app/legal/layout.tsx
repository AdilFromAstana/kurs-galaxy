import Header from '@/components/layout/Header';
import SiteFooter from '@/components/layout/SiteFooter';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <SiteFooter />
    </>
  );
}
