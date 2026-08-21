import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const body = await req.json().catch(() => ({}));
  const order = Array.isArray(body.order) ? body.order : null;
  if (!order || order.some((v: unknown) => typeof v !== 'string')) {
    return NextResponse.json(
      { error: 'order must be an array of video ids' },
      { status: 400 },
    );
  }

  const existing = await prisma.lessonVideo.findMany({
    where: { lessonId: params.id },
    select: { id: true },
  });
  const known = new Set(existing.map((v) => v.id));
  if (order.length !== known.size || order.some((id: string) => !known.has(id))) {
    return NextResponse.json({ error: 'order_mismatch' }, { status: 400 });
  }

  await prisma.$transaction(
    order.map((id: string, i: number) =>
      prisma.lessonVideo.update({ where: { id }, data: { order: i } }),
    ),
  );

  const videos = await prisma.lessonVideo.findMany({
    where: { lessonId: params.id },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json({ videos });
}
