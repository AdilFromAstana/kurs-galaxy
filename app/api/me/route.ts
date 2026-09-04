import { NextResponse } from 'next/server';
import {
  createUserSession,
  getUserSession,
  shouldRenewSession,
} from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  if (shouldRenewSession(session)) {
    await createUserSession({
      userId: session.userId,
      email: session.email,
      name: session.name,
    });
  }

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
