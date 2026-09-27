import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ leads });
}
