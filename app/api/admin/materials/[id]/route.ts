import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  await prisma.material.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
