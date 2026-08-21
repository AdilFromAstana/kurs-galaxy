import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const lessonId = url.searchParams.get('lessonId');
  const videoId = url.searchParams.get('videoId');
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 });

  // findFirst, а не findUnique: составной ключ содержит nullable videoId
  const pos = await prisma.videoPosition.findFirst({
    where: { userId: session.userId, lessonId, videoId: videoId || null },
  });

  // Легаси-фолбэк: позиция урока сохранялась без videoId
  if (!pos && videoId) {
    const legacy = await prisma.videoPosition.findFirst({
      where: { userId: session.userId, lessonId, videoId: null },
    });
    return NextResponse.json({ time: legacy?.time ?? 0 });
  }

  return NextResponse.json({ time: pos?.time ?? 0 });
}

export async function POST(req: Request) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { lessonId, videoId, time } = await req.json().catch(() => ({}));
  if (!lessonId || typeof time !== 'number') {
    return NextResponse.json({ error: 'lessonId and time required' }, { status: 400 });
  }

  const key = { userId: session.userId, lessonId, videoId: videoId || null };
  const existing = await prisma.videoPosition.findFirst({ where: key });

  if (existing) {
    await prisma.videoPosition.update({ where: { id: existing.id }, data: { time } });
  } else {
    await prisma.videoPosition.create({ data: { ...key, time } });
  }

  return NextResponse.json({ ok: true });
}
