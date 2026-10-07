import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guard';
import {
  loadLandingContentWithVersion,
  sanitizeLandingContent,
  saveLandingContent,
} from '@/lib/landingContent';

export const dynamic = 'force-dynamic';

export async function GET() {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  return NextResponse.json(await loadLandingContentWithVersion());
}

// Сохраняет контент главной целиком (все вкладки редактора разом).
// version — какую версию редактировали; если её уже сменили, отвечаем 409.
export async function PUT(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const version = typeof body.version === 'string' ? body.version : null;
  const result = await saveLandingContent(sanitizeLandingContent(body.content ?? body), version);
  if (result === 'conflict') {
    return NextResponse.json(
      {
        error: 'conflict',
        message:
          'Главную уже изменили в другой вкладке или на другом устройстве. Обновите страницу, чтобы не затереть эти изменения.',
      },
      { status: 409 },
    );
  }
  return NextResponse.json(await loadLandingContentWithVersion());
}
