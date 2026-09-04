import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserSession, getAdminSession } from '@/lib/auth/session';

type LessonWithCourse = {
  id: string;
  videoUrl: string;
  isFree: boolean;
  module: { courseId: string };
};

type AccessResult =
  | { ok: true; lesson: LessonWithCourse }
  | { ok: false; response: NextResponse };

export async function resolveLessonVideoAccess(
  lessonId: string,
): Promise<AccessResult> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { select: { courseId: true } } },
  });
  if (!lesson) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'lesson_not_found' }, { status: 404 }),
    };
  }
  if (!lesson.videoUrl) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'no_video' }, { status: 404 }),
    };
  }

  const adminSession = await getAdminSession();
  if (!adminSession && !lesson.isFree) {
    const userSession = await getUserSession();
    if (!userSession) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
      };
    }
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: userSession.userId,
        courseId: lesson.module.courseId,
        status: 'ACTIVE',
      },
    });
    if (!purchase) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'no_access' }, { status: 403 }),
      };
    }
    if (purchase.expiresAt && purchase.expiresAt.getTime() < Date.now()) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'access_expired' }, { status: 403 }),
      };
    }
  }

  return { ok: true, lesson: lesson as LessonWithCourse };
}

type LessonVideoRow = {
  id: string;
  url: string;
  lessonId: string;
};

type VideoAccessResult =
  | { ok: true; video: LessonVideoRow }
  | { ok: false; response: NextResponse };

export async function resolveLessonVideoRowAccess(
  videoId: string,
): Promise<VideoAccessResult> {
  const video = await prisma.lessonVideo.findUnique({
    where: { id: videoId },
    include: {
      lesson: { include: { module: { select: { courseId: true } } } },
    },
  });
  if (!video) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'video_not_found' }, { status: 404 }),
    };
  }
  if (!video.url) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'no_video' }, { status: 404 }),
    };
  }

  const adminSession = await getAdminSession();
  if (!adminSession && !video.lesson.isFree) {
    const userSession = await getUserSession();
    if (!userSession) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
      };
    }
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: userSession.userId,
        courseId: video.lesson.module.courseId,
        status: 'ACTIVE',
      },
    });
    if (!purchase) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'no_access' }, { status: 403 }),
      };
    }
    if (purchase.expiresAt && purchase.expiresAt.getTime() < Date.now()) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'access_expired' }, { status: 403 }),
      };
    }
  }

  return {
    ok: true,
    video: { id: video.id, url: video.url, lessonId: video.lessonId },
  };
}
