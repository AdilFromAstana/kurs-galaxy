import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserSession } from '@/lib/auth/session';
import { renderCertificatePdf } from '@/lib/certificate';
import { issueCertificateIfCompleted, siteBaseUrl } from '@/lib/certificateIssue';
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

  // Те же правила, что и при автоматической выдаче после последнего урока
  const issued = await issueCertificateIfCompleted(session.userId, params.id, siteBaseUrl(req), req);
  if (!issued.ok) {
    switch (issued.reason) {
      case 'not_found':
        return NextResponse.json({ error: 'course_not_found' }, { status: 404 });
      case 'no_lessons':
        return NextResponse.json({ error: 'no_lessons', message: 'В курсе нет уроков' }, { status: 400 });
      case 'no_access':
        return NextResponse.json({ error: 'no_access', message: 'Курс не куплен' }, { status: 403 });
      case 'access_expired':
        return NextResponse.json({ error: 'access_expired', message: 'Срок доступа истёк' }, { status: 403 });
      case 'not_completed':
        return NextResponse.json(
          {
            error: 'not_completed',
            message: 'Курс ещё не пройден полностью',
            completed: issued.completed,
            total: issued.total,
          },
          { status: 403 },
        );
    }
  }

  const course = await prisma.course.findFirst({
    where: { OR: [{ id: params.id }, { slug: params.id }] },
    select: { id: true, slug: true, title: true },
  });
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true },
  });
  if (!course || !user) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const recipientName = user.name || user.email || 'Студент';
  const settings = await loadOrCreateCertificateSettings(req);

  // Обновляем имя/курс/шаблон на актуальные (на случай если их поменяли); дата выдачи и номер — прежние
  const cert = await prisma.certificate.update({
    where: { id: issued.certificateId },
    data: { userName: recipientName, courseTitle: course.title, templateId: settings.templateId },
  });

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
