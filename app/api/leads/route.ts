import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const MAX_REQUESTS = 5;
const WINDOW_MS = 10 * 60_000;

// Публичная форма «Остались вопросы?» на главной
export async function POST(req: Request) {
  const rl = rateLimit(`lead:${getClientIp(req)}`, MAX_REQUESTS, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Слишком много заявок. Попробуйте позже.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  let body: { name?: unknown; phone?: unknown; consent?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const digits = phone.replace(/\D/g, '');

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: 'Укажите имя' }, { status: 400 });
  }
  if (digits.length < 10 || digits.length > 15) {
    return NextResponse.json({ error: 'Укажите корректный номер телефона' }, { status: 400 });
  }
  if (body.consent !== true) {
    return NextResponse.json(
      { error: 'Нужно согласие на обработку персональных данных' },
      { status: 400 },
    );
  }

  await prisma.lead.create({ data: { name, phone: `+${digits}` } });
  return NextResponse.json({ ok: true });
}
