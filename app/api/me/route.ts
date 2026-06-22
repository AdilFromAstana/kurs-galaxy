import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  const [user, purchases, progress, lastLessons] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    }),
    prisma.purchase.findMany({
      where: { userId: session.userId },
      include: { plan: true },
    }),
    prisma.progress.findMany({ where: { userId: session.userId } }),
    prisma.lastLesson.findMany({ where: { userId: session.userId } }),
  ]);

  return NextResponse.json({ user, purchases, progress, lastLessons });
}
