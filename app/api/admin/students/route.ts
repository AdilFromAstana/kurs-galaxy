import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export async function GET(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim();

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' as const } },
          { name: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const students = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: { select: { purchases: true, progress: true } },
    },
  });
  return NextResponse.json({ students });
}
