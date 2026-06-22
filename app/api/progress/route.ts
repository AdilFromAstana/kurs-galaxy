import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const courseId = url.searchParams.get('courseId') ?? undefined;

  const items = await prisma.progress.findMany({
    where: { userId: session.userId, ...(courseId ? { courseId } : {}) },
    select: { courseId: true, lessonId: true, completedAt: true },
  });
  return NextResponse.json({ progress: items });
}

// POST { lessonId } — отметить пройденным
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

  // Доступ: бесплатный урок открыт всем авторизованным; платный — только при
  // активной непросроченной покупке курса. Иначе — 403 no_access.
  if (!lesson.isFree) {
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: session.userId,
        courseId: lesson.module.courseId,
        status: 'ACTIVE',
      },
    });
    if (!purchase) {
      return NextResponse.json({ error: 'no_access' }, { status: 403 });
    }
    if (purchase.expiresAt && purchase.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'access_expired' }, { status: 403 });
    }
  }

  const item = await prisma.progress.upsert({
    where: { userId_lessonId: { userId: session.userId, lessonId } },
    create: {
      userId: session.userId,
      lessonId,
      courseId: lesson.module.courseId,
    },
    update: {},
  });

  await prisma.lastLesson.upsert({
    where: { userId_courseId: { userId: session.userId, courseId: lesson.module.courseId } },
    create: { userId: session.userId, courseId: lesson.module.courseId, lessonId },
    update: { lessonId },
  });

  return NextResponse.json({ progress: item });
}
