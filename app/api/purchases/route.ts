import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { purchaseReceiptEmail, sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

function getBaseUrl(req: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  }
  const origin = req.headers.get('origin');
  if (origin) return origin;
  const host = req.headers.get('host');
  if (host) {
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    return `${proto}://${host}`;
  }
  return 'http://localhost:39010';
}

async function sendReceiptFireAndForget({
  req,
  userEmail,
  userName,
  courseTitle,
  courseSlug,
  planName,
  amount,
  currency,
  expiresAt,
}: {
  req: Request;
  userEmail: string;
  userName: string;
  courseTitle: string;
  courseSlug: string;
  planName: string;
  amount: number;
  currency: string;
  expiresAt: Date | null;
}) {
  try {
    const baseUrl = getBaseUrl(req);
    const cs = await prisma.certificateSettings.findUnique({
      where: { id: 'default' },
    });
    const brandName = cs?.brandName ?? 'KursGalaxy.kz';
    const message = purchaseReceiptEmail({
      recipientName: userName,
      courseTitle,
      planName,
      amount,
      currency,
      expiresAt,
      courseUrl: `${baseUrl}/course/${courseSlug}`,
      brandName,
    });
    message.to = userEmail;
    await sendEmail(message);
  } catch (err) {
    console.error('[purchases] receipt email failed:', err);
  }
}

// POST { planId }  — имитация покупки. Реальная платёжка подключается тут.
export async function POST(req: Request) {
  const session = await getUserSession();
  if (!session)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { planId } = await req.json().catch(() => ({}));
  if (!planId)
    return NextResponse.json({ error: 'planId required' }, { status: 400 });

  const plan = await prisma.pricingPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: 'plan not found' }, { status: 404 });
  }

  const expiresAt =
    plan.accessPeriod === 'UNLIMITED' || !plan.accessDays
      ? null
      : new Date(Date.now() + plan.accessDays * 24 * 60 * 60 * 1000);

  // Транзакционная защита от двойной покупки. Если у юзера уже есть
  // ACTIVE-покупка этого курса (включая ту, что не истекла) — возвращаем 409.
  // Реальный платёжный flow тут должен использовать SELECT FOR UPDATE или
  // partial unique index, но для mock-режима достаточно findFirst+create в транзакции.
  let purchase;
  try {
    purchase = await prisma.$transaction(async (tx) => {
      const existing = await tx.purchase.findFirst({
        where: {
          userId: session.userId,
          courseId: plan.courseId,
          status: 'ACTIVE',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      if (existing) {
        const err = new Error('already_purchased');
        (err as any).code = 'ALREADY_PURCHASED';
        throw err;
      }
      return tx.purchase.create({
        data: {
          userId: session.userId,
          courseId: plan.courseId,
          planId: plan.id,
          status: 'ACTIVE',
          expiresAt,
          paymentAmount: plan.price,
          paymentCurrency: plan.currency,
          paymentStatus: 'COMPLETED',
          paymentMethod: 'mock',
        },
        include: {
          plan: true,
          course: { select: { id: true, slug: true, title: true } },
        },
      });
    });
  } catch (err: any) {
    if (err?.code === 'ALREADY_PURCHASED') {
      return NextResponse.json(
        { error: 'already_purchased', message: 'У вас уже есть активный доступ к этому курсу' },
        { status: 409 },
      );
    }
    throw err;
  }

  // Шлём чек на email (не блокируя ответ)
  void sendReceiptFireAndForget({
    req,
    userEmail: session.email,
    userName: session.name,
    courseTitle: purchase.course.title,
    courseSlug: purchase.course.slug,
    planName: purchase.plan.name,
    amount: purchase.paymentAmount,
    currency: purchase.paymentCurrency,
    expiresAt: purchase.expiresAt,
  });

  return NextResponse.json({ purchase });
}

export async function GET() {
  const session = await getUserSession();
  if (!session)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const purchases = await prisma.purchase.findMany({
    where: { userId: session.userId },
    include: {
      plan: true,
      course: { select: { id: true, slug: true, title: true } },
    },
    orderBy: { purchasedAt: 'desc' },
  });
  return NextResponse.json({ purchases });
}
