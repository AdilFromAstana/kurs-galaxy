import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guard';
import {
  loadLandingContent,
  sanitizeLandingContent,
  saveLandingContent,
} from '@/lib/landingContent';

export const dynamic = 'force-dynamic';

export async function GET() {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const content = await loadLandingContent();
  return NextResponse.json({ content });
}

// Сохраняет контент главной целиком (все вкладки редактора разом)
export async function PUT(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  await saveLandingContent(sanitizeLandingContent(body));
  const content = await loadLandingContent();
  return NextResponse.json({ content });
}
