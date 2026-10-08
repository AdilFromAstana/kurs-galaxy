import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import { checkLink, claimLink } from '@/lib/accessLinks';
import { getClientIp, rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// GET — что за ссылка: на какой курс и действует ли (страница /access/[token] показывает это гостю)
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const state = await checkLink(params.token);
  if (!state.ok) return NextResponse.json({ ok: false, reason: state.reason });
  return NextResponse.json({
    ok: true,
    course: { id: state.link.courseId, title: state.link.courseTitle },
    accessDays: state.link.accessDays,
  });
}

// POST — активировать: ученица должна войти; доступ открывается только к курсу этой ссылки
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Перебор кодов ссылок не даст ничего, но и нагружать БД не дадим
  const rl = rateLimit(`access-claim:${getClientIp(req)}`, 30, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const result = await claimLink(params.token, session.userId);
  if (!result.ok) return NextResponse.json({ ok: false, reason: result.reason }, { status: 409 });
  return NextResponse.json(result);
}
