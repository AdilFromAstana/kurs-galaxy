import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

// POST { userId, planId } — выдать доступ вручную (например, после оплаты на Каспи)
export async function POST(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId ?? '');
  const planId = String(body.planId ?? '');

  if (!userId || !planId) {
    return NextResponse.json(
      { error: 'missing_fields', message: 'userId и planId обязательны' },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json(
      { error: 'user_not_found' },
      { status: 404 },
    );
  }

  const plan = await prisma.pricingPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    return NextResponse.json(
      { error: 'plan_not_found' },
      { status: 404 },
    );
  }

  const expiresAt =
    plan.accessPeriod === 'UNLIMITED' || !plan.accessDays
      ? null
      : new Date(Date.now() + plan.accessDays * 24 * 60 * 60 * 1000);

  const purchase = await prisma.purchase.create({
    data: {
      userId: user.id,
      courseId: plan.courseId,
      planId: plan.id,
      status: 'ACTIVE',
      expiresAt,
      paymentAmount: plan.price,
      paymentCurrency: plan.currency,
      paymentStatus: 'COMPLETED',
      paymentMethod: 'admin_manual',
    },
    include: {
      plan: true,
      course: { select: { id: true, slug: true, title: true } },
    },
  });

  return NextResponse.json({ purchase });
}
