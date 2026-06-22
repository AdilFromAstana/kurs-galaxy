import { NextResponse } from 'next/server';
import fs from 'fs';
import { promises as fsp } from 'fs';
import { Readable } from 'node:stream';
import path from 'path';
import { prisma } from '@/lib/db';
import { getUserSession, getAdminSession } from '@/lib/auth/session';
import { resolveLocalLessonPath, isLocalLessonVideo } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

const MIME_BY_EXT: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
};

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    include: { module: { select: { courseId: true } } },
  });
  if (!lesson) {
    return NextResponse.json({ error: 'lesson_not_found' }, { status: 404 });
  }
  if (!lesson.videoUrl) {
    return NextResponse.json({ error: 'no_video' }, { status: 404 });
  }

  // ===== Авторизация =====
  // Админ — всегда (для предпросмотра).
  // Бесплатный урок — открыт всем (даже гостям).
  // Платный — требует user-сессии и активной непросроченной покупки.
  const adminSession = await getAdminSession();

  if (!adminSession && !lesson.isFree) {
    const userSession = await getUserSession();
    if (!userSession) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: userSession.userId,
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

  // ===== Внешний URL — редиректим =====
  if (!isLocalLessonVideo(lesson.videoUrl)) {
    return NextResponse.redirect(lesson.videoUrl);
  }

  // ===== Локальный файл — стримим =====
  const filePath = resolveLocalLessonPath(lesson.videoUrl);
  if (!filePath) {
    return NextResponse.json({ error: 'invalid_path' }, { status: 400 });
  }

  let stat: import('fs').Stats;
  try {
    stat = await fsp.stat(filePath);
  } catch {
    return NextResponse.json({ error: 'file_missing' }, { status: 404 });
  }

  const total = stat.size;
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_BY_EXT[ext] ?? 'application/octet-stream';

  const rangeHeader = req.headers.get('range');

  // Базовые заголовки безопасности — кешировать в браузере, не в публичных кешах
  const baseHeaders: Record<string, string> = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=0, must-revalidate',
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff',
  };

  if (rangeHeader) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader);
    if (!match) {
      return new Response(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${total}` },
      });
    }
    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : total - 1;

    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start >= total ||
      end >= total ||
      start > end
    ) {
      return new Response(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${total}` },
      });
    }

    const chunkSize = end - start + 1;
    const nodeStream = fs.createReadStream(filePath, { start, end });
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new Response(webStream, {
      status: 206,
      headers: {
        ...baseHeaders,
        'Content-Length': String(chunkSize),
        'Content-Range': `bytes ${start}-${end}/${total}`,
      },
    });
  }

  const nodeStream = fs.createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;
  return new Response(webStream, {
    status: 200,
    headers: {
      ...baseHeaders,
      'Content-Length': String(total),
    },
  });
}
