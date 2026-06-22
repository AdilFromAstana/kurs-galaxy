import { NextResponse } from 'next/server';
import { loadOrCreateSiteSettings, publicSubset } from '@/lib/siteSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await loadOrCreateSiteSettings();
  return NextResponse.json({ settings: publicSubset(settings) });
}
