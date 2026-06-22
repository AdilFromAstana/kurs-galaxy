import { loadOrCreateSiteSettings } from '@/lib/siteSettings';
import { getRefundText } from '@/lib/legalTemplates';
import { prisma } from '@/lib/db';
import LegalPage from '@/components/legal/LegalPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Условия возврата — KursGalaxy.kz',
};

export default async function RefundPage() {
  const settings = await loadOrCreateSiteSettings();
  const cs = await prisma.certificateSettings.findUnique({
    where: { id: 'default' },
  });
  const brandName = cs?.brandName ?? 'KursGalaxy.kz';
  const body = getRefundText({ settings, brandName });

  return <LegalPage title="Условия возврата" body={body} />;
}
