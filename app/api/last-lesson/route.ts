import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { lessonId } = await req.json().catch(() => ({}));
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 });

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });
  if (!lesson) return NextResponse.json({ error: 'lesson not found' }, { status: 404 });

  await prisma.lastLesson.upsert({
    where: { userId_courseId: { userId: session.userId, courseId: lesson.module.courseId } },
    create: { userId: session.userId, courseId: lesson.module.courseId, lessonId },
    update: { lessonId },
  });

  return NextResponse.json({ ok: true });
}
