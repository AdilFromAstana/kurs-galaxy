import { NextResponse } from 'next/server';
import { loadLandingContent } from '@/lib/landingContent';

export const dynamic = 'force-dynamic';

export async function GET() {
  const content = await loadLandingContent();
  return NextResponse.json({ content });
}
