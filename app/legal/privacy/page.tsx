import { loadOrCreateSiteSettings } from '@/lib/siteSettings';
import { getPrivacyText } from '@/lib/legalTemplates';
import { prisma } from '@/lib/db';
import LegalPage from '@/components/legal/LegalPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Политика конфиденциальности — KursGalaxy.kz',
};

export default async function PrivacyPage() {
  const settings = await loadOrCreateSiteSettings();
  const cs = await prisma.certificateSettings.findUnique({
    where: { id: 'default' },
  });
  const brandName = cs?.brandName ?? 'KursGalaxy.kz';
  const body = getPrivacyText({ settings, brandName });

  return <LegalPage title="Политика конфиденциальности" body={body} />;
}
