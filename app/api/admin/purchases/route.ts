import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';
import { ensureLinkPlan } from '@/lib/accessLinks';

export const dynamic = 'force-dynamic';

// POST — выдать доступ вручную (после оплаты на Каспи, подарок):
//   { userId, courseId, accessDays? } — курс бесплатно, без тарифа; accessDays не задан — бессрочно
//   { userId, planId }               — по тарифу курса (как при покупке)
export async function POST(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId ?? '');
  const courseId = String(body.courseId ?? '');

  if (userId && courseId && !body.planId) {
    const [user, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.course.findUnique({ where: { id: courseId } }),
    ]);
    if (!user || !course) {
      return NextResponse.json({ error: 'not_found', message: 'Ученица или курс не найдены' }, { status: 404 });
    }
    const now = new Date();
    const already = await prisma.purchase.findFirst({
      where: {
        userId,
        courseId,
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });
    if (already) {
      return NextResponse.json(
        { error: 'already_has_access', message: 'У ученицы уже есть доступ к этому курсу — его можно продлить ниже' },
        { status: 409 },
      );
    }
    const days = Number(body.accessDays);
    const plan = await ensureLinkPlan(courseId);
    const purchase = await prisma.purchase.create({
      data: {
        userId,
        courseId,
        planId: plan.id,
        status: 'ACTIVE',
        expiresAt: Number.isInteger(days) && days > 0 ? new Date(now.getTime() + days * 86_400_000) : null,
        paymentAmount: 0,
        paymentStatus: 'COMPLETED',
        paymentMethod: 'admin_gift',
      },
      include: { plan: true, course: { select: { id: true, slug: true, title: true } } },
    });
    return NextResponse.json({ purchase });
  }

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
