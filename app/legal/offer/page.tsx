import { loadOrCreateSiteSettings } from '@/lib/siteSettings';
import { getOfferText } from '@/lib/legalTemplates';
import { prisma } from '@/lib/db';
import LegalPage from '@/components/legal/LegalPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Договор-оферта — KursGalaxy.kz',
};

export default async function OfferPage() {
  const settings = await loadOrCreateSiteSettings();
  const cs = await prisma.certificateSettings.findUnique({
    where: { id: 'default' },
  });
  const brandName = cs?.brandName ?? 'KursGalaxy.kz';
  const body = getOfferText({ settings, brandName });

  return <LegalPage title="Договор-оферта" body={body} />;
}
