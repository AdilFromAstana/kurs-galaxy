import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const lessonId = url.searchParams.get('lessonId');
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 });

  const pos = await prisma.videoPosition.findUnique({
    where: { userId_lessonId: { userId: session.userId, lessonId } },
  });
  return NextResponse.json({ time: pos?.time ?? 0 });
}

export async function POST(req: Request) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { lessonId, time } = await req.json().catch(() => ({}));
  if (!lessonId || typeof time !== 'number') {
    return NextResponse.json({ error: 'lessonId and time required' }, { status: 400 });
  }
  await prisma.videoPosition.upsert({
    where: { userId_lessonId: { userId: session.userId, lessonId } },
    create: { userId: session.userId, lessonId, time },
    update: { time },
  });
  return NextResponse.json({ ok: true });
}
