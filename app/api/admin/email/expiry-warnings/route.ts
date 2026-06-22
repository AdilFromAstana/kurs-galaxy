import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';
import { expiryWarningEmail, sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function getBaseUrl(req: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  }
  const host = req.headers.get('host');
  if (host) {
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    return `${proto}://${host}`;
  }
  return 'http://localhost:39010';
}

// GET — посчитать кому надо отправить (без отправки)
export async function GET(_req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const now = new Date();
  const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const expiring = await prisma.purchase.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { gte: now, lte: inSevenDays },
    },
    include: {
      user: { select: { email: true, name: true } },
      course: { select: { id: true, slug: true, title: true } },
    },
  });

  return NextResponse.json({
    count: expiring.length,
    expiring: expiring.map((p) => ({
      id: p.id,
      userEmail: p.user.email,
      userName: p.user.name,
      courseTitle: p.course.title,
      expiresAt: p.expiresAt,
    })),
  });
}

// POST — отправить письма всем у кого доступ истекает в ближайшие 7 дней
export async function POST(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const now = new Date();
  const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const expiring = await prisma.purchase.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { gte: now, lte: inSevenDays },
    },
    include: {
      user: { select: { email: true, name: true } },
      course: { select: { id: true, slug: true, title: true } },
    },
  });

  if (expiring.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, total: 0 });
  }

  const baseUrl = getBaseUrl(req);
  const settings = await prisma.certificateSettings.findUnique({
    where: { id: 'default' },
  });
  const brandName = settings?.brandName ?? 'KursGalaxy.kz';

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const p of expiring) {
    if (!p.expiresAt) continue;
    const days = Math.max(
      1,
      Math.ceil((p.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    );
    const message = expiryWarningEmail({
      recipientName: p.user.name,
      courseTitle: p.course.title,
      daysRemaining: days,
      expiresAt: p.expiresAt,
      courseUrl: `${baseUrl}/course/${p.course.slug}`,
      brandName,
    });
    message.to = p.user.email;

    const result = await sendEmail(message);
    if (result.ok) {
      sent++;
    } else {
      failed++;
      errors.push(`${p.user.email}: ${result.reason}`);
    }
  }

  return NextResponse.json({
    sent,
    failed,
    total: expiring.length,
    errors: errors.slice(0, 10),
  });
}
