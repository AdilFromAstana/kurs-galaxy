import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

// PATCH { active?, note? } — отключить/включить ссылку, поправить подпись.
// Отключение не забирает уже выданный доступ — для этого «Закрыть доступ» у человека.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const body = await req.json().catch(() => ({}));
  const data: { active?: boolean; note?: string | null } = {};
  if (typeof body.active === 'boolean') data.active = body.active;
  if (typeof body.note === 'string') data.note = body.note.trim().slice(0, 200) || null;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 });
  const link = await prisma.accessLink.update({ where: { id: params.id }, data }).catch(() => null);
  if (!link) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ link });
}
