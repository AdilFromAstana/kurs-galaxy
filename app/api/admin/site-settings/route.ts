import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guard';
import {
  loadOrCreateSiteSettings,
  updateSiteSettings,
  type SiteSettingsData,
} from '@/lib/siteSettings';

export const dynamic = 'force-dynamic';

const STRING_FIELDS: (keyof SiteSettingsData)[] = [
  'contactPhone',
  'contactEmail',
  'contactWhatsapp',
  'contactTelegram',
  'contactInstagram',
  'legalEntityName',
  'legalRequisites',
  'legalAddress',
  'legalRegisteredAt',
  'offerText',
  'privacyText',
  'refundText',
];

export async function GET() {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const settings = await loadOrCreateSiteSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const body = await req.json().catch(() => ({}));

  const patch: Partial<SiteSettingsData> = {};
  for (const key of STRING_FIELDS) {
    if (typeof body[key] === 'string') {
      const trimmed = (body[key] as string).trim();
      patch[key] = trimmed.length > 0 ? trimmed : null;
    } else if (body[key] === null) {
      patch[key] = null;
    }
  }

  await updateSiteSettings(patch);
  const settings = await loadOrCreateSiteSettings();
  return NextResponse.json({ settings });
}
