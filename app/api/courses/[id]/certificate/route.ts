import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserSession } from '@/lib/auth/session';
import {
  buildCertificateId,
  renderCertificatePdf,
} from '@/lib/certificate';
import { loadOrCreateCertificateSettings } from '@/lib/certificateSettings';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const course = await prisma.course.findFirst({
    where: { OR: [{ id: params.id }, { slug: params.id }] },
    include: {
      modules: { include: { lessons: { select: { id: true } } } },
    },
  });
  if (!course) {
    return NextResponse.json({ error: 'course_not_found' }, { status: 404 });
  }

  const allLessonIds = course.modules.flatMap((m) =>
    m.lessons.map((l) => l.id),
  );
  const totalLessons = allLessonIds.length;

  if (totalLessons === 0) {
    return NextResponse.json(
      { error: 'no_lessons', message: 'В курсе нет уроков' },
      { status: 400 },
    );
  }

  // Доступ
  const purchase = await prisma.purchase.findFirst({
    where: {
      userId: session.userId,
      courseId: course.id,
      status: 'ACTIVE',
    },
  });
  if (!purchase) {
    return NextResponse.json(
      { error: 'no_access', message: 'Курс не куплен' },
      { status: 403 },
    );
  }
  if (purchase.expiresAt && purchase.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: 'access_expired', message: 'Срок доступа истёк' },
      { status: 403 },
    );
  }

  // 100% прогресс
  const completed = await prisma.progress.findMany({
    where: { userId: session.userId, lessonId: { in: allLessonIds } },
    select: { lessonId: true },
  });
  if (completed.length < totalLessons) {
    return NextResponse.json(
      {
        error: 'not_completed',
        message: 'Курс ещё не пройден полностью',
        completed: completed.length,
        total: totalLessons,
      },
      { status: 403 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
  }

  const recipientName = user.name || user.email || 'Студент';
  const settings = await loadOrCreateCertificateSettings(req);

  // Стабильный certificate ID
  const completedAt = new Date();
  const certificateId = buildCertificateId({
    userId: session.userId,
    courseId: course.id,
    completedAt,
  });

  // Сохраняем (или находим) запись Certificate для верификации
  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId: session.userId, courseId: course.id } },
  });

  let cert;
  if (existing) {
    // Обновляем имя/курс/шаблон на актуальные (на случай если их поменяли)
    cert = await prisma.certificate.update({
      where: { id: existing.id },
      data: {
        userName: recipientName,
        courseTitle: course.title,
        templateId: settings.templateId,
      },
    });
  } else {
    cert = await prisma.certificate.create({
      data: {
        id: certificateId,
        userId: session.userId,
        courseId: course.id,
        userName: recipientName,
        courseTitle: course.title,
        templateId: settings.templateId,
      },
    });
  }

  const pdfBytes = await renderCertificatePdf(
    {
      recipientName,
      courseTitle: course.title,
      completedAt: cert.issuedAt,
      certificateId: cert.id,
    },
    settings,
  );

  const safeAscii = `certificate-${cert.id}.pdf`;
  const utf8Name = `сертификат-${course.slug}.pdf`;
  const filenameHeader = `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(utf8Name)}`;

  return new Response(pdfBytes as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdfBytes.length),
      'Content-Disposition': filenameHeader,
      'Cache-Control': 'private, max-age=0, no-store',
    },
  });
}
