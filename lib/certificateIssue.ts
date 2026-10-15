import { prisma } from '@/lib/db';
import { buildCertificateId } from '@/lib/certificate';
import { loadOrCreateCertificateSettings } from '@/lib/certificateSettings';
import { certificateReadyEmail, sendEmail } from '@/lib/email';

// Выдача сертификата. Вызывается сразу, когда ученица отметила последний
// непройденный урок курса (в любом порядке), и при скачивании PDF.
// Запись Certificate создаётся один раз — по ней работает проверка подлинности (QR).

export type IssueResult =
  | { ok: true; certificateId: string; isNew: boolean }
  | { ok: false; reason: 'no_lessons' | 'not_completed' | 'no_access' | 'access_expired' | 'not_found'; completed?: number; total?: number };

/** Прошла ли ученица курс целиком и есть ли у неё к нему доступ. */
export async function courseCompletion(userId: string, courseId: string) {
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: courseId }, { slug: courseId }] },
    include: { modules: { include: { lessons: { select: { id: true } } } } },
  });
  if (!course) return { course: null, reason: 'not_found' as const };
  const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  if (lessonIds.length === 0) return { course, reason: 'no_lessons' as const };

  if (!course.isFree) {
    const purchase = await prisma.purchase.findFirst({
      where: { userId, courseId: course.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (!purchase) return { course, reason: 'no_access' as const };
    if (purchase.expiresAt && purchase.expiresAt.getTime() < Date.now()) {
      return { course, reason: 'access_expired' as const };
    }
  }

  const completed = await prisma.progress.count({
    where: { userId, lessonId: { in: lessonIds } },
  });
  if (completed < lessonIds.length) {
    return { course, reason: 'not_completed' as const, completed, total: lessonIds.length };
  }
  return { course, reason: null, completed, total: lessonIds.length };
}

/**
 * Выдать сертификат, если курс пройден. Новый сертификат — письмо ученице
 * со ссылкой на скачивание (если почта настроена; ошибка письма выдачу не ломает).
 */
export async function issueCertificateIfCompleted(
  userId: string,
  courseId: string,
  baseUrl: string | null,
  req?: Request,
): Promise<IssueResult> {
  const state = await courseCompletion(userId, courseId);
  if (!state.course) return { ok: false, reason: 'not_found' };
  if (state.reason) {
    return { ok: false, reason: state.reason, completed: state.completed, total: state.total };
  }
  const course = state.course;

  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });
  if (existing) return { ok: true, certificateId: existing.id, isNew: false };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  if (!user) return { ok: false, reason: 'not_found' };
  const settings = await loadOrCreateCertificateSettings(req);

  let cert = null;
  for (let attempt = 0; attempt < 5 && !cert; attempt++) {
    try {
      cert = await prisma.certificate.create({
        data: {
          id: buildCertificateId({ userId, courseId: course.id, completedAt: new Date() }),
          userId,
          courseId: course.id,
          userName: user.name || user.email || 'Студент',
          courseTitle: course.title,
          templateId: settings.templateId,
        },
      });
    } catch {
      // Два запроса одновременно (двойной клик) — второй находит уже созданный;
      // иначе совпал случайный номер — пробуем другой
      const again = await prisma.certificate.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
      });
      if (again) return { ok: true, certificateId: again.id, isNew: false };
    }
  }
  if (!cert) throw new Error('certificate_create_failed');

  if (baseUrl && user.email) {
    const msg = certificateReadyEmail({
      recipientName: user.name,
      courseTitle: course.title,
      certificateId: cert.id,
      downloadUrl: `${baseUrl}/api/courses/${course.id}/certificate`,
      verifyUrl: `${baseUrl}/cert/verify/${cert.id}`,
      brandName: settings.brandName,
    });
    msg.to = user.email;
    sendEmail(msg).catch((e) => console.error('[certificate] email failed:', e));
  }

  return { ok: true, certificateId: cert.id, isNew: true };
}

/** Адрес сайта для ссылок в письме: домен, с которого пришла ученица; иначе — из настроек. */
export function siteBaseUrl(req: Request): string | null {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (host) return `${req.headers.get('x-forwarded-proto') ?? 'https'}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || null;
}
