import { prisma } from '@/lib/db';

const SINGLETON_ID = 'default';

export interface SiteSettingsData {
  contactPhone: string | null;
  contactEmail: string | null;
  contactWhatsapp: string | null;
  contactTelegram: string | null;
  contactInstagram: string | null;
  legalEntityName: string | null;
  legalRequisites: string | null;
  legalAddress: string | null;
  legalRegisteredAt: string | null;
  offerText: string | null;
  privacyText: string | null;
  refundText: string | null;
}

export async function loadOrCreateSiteSettings(): Promise<SiteSettingsData> {
  let row = await prisma.siteSettings.findUnique({
    where: { id: SINGLETON_ID },
  });
  if (!row) {
    row = await prisma.siteSettings.create({ data: { id: SINGLETON_ID } });
  }
  return {
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    contactWhatsapp: row.contactWhatsapp,
    contactTelegram: row.contactTelegram,
    contactInstagram: row.contactInstagram,
    legalEntityName: row.legalEntityName,
    legalRequisites: row.legalRequisites,
    legalAddress: row.legalAddress,
    legalRegisteredAt: row.legalRegisteredAt,
    offerText: row.offerText,
    privacyText: row.privacyText,
    refundText: row.refundText,
  };
}

export async function updateSiteSettings(
  patch: Partial<SiteSettingsData>,
): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...patch },
    update: patch,
  });
}

/**
 * Только публичные поля, безопасные для отображения посетителям.
 * (Сейчас все поля и так публичные, но если в будущем добавим приватные — этот фильтр останется.)
 */
export function publicSubset(s: SiteSettingsData) {
  return {
    contactPhone: s.contactPhone,
    contactEmail: s.contactEmail,
    contactWhatsapp: s.contactWhatsapp,
    contactTelegram: s.contactTelegram,
    contactInstagram: s.contactInstagram,
    legalEntityName: s.legalEntityName,
    legalRequisites: s.legalRequisites,
    legalAddress: s.legalAddress,
  };
}

export type PublicSiteSettings = ReturnType<typeof publicSubset>;
