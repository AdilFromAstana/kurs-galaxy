import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';
import type { AccessPeriodType } from '@prisma/client';

const PERIOD_DAYS: Record<AccessPeriodType, number | null> = {
  ONE_MONTH: 30,
  TWO_MONTHS: 60,
  THREE_MONTHS: 90,
  SIX_MONTHS: 180,
  TWELVE_MONTHS: 365,
  UNLIMITED: null,
};
const PERIODS = Object.keys(PERIOD_DAYS) as AccessPeriodType[];

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: params.id }, { slug: params.id }] },
    include: { pricingPlans: { orderBy: { order: 'asc' } } },
  });
  if (!course) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ pricingPlans: course.pricingPlans });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: params.id }, { slug: params.id }] },
  });
  if (!course) return NextResponse.json({ error: 'course_not_found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? '').trim();
  const description = body.description ? String(body.description) : null;
  const accessPeriod = (PERIODS.includes(body.accessPeriod) ? body.accessPeriod : 'ONE_MONTH') as AccessPeriodType;
  const price = Number(body.price);
  const currency = String(body.currency ?? 'KZT');
  const isActive = body.isActive !== false;
  const isRecommended = Boolean(body.isRecommended);

  if (!name || !Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: 'name and price required' }, { status: 400 });
  }

  const last = await prisma.pricingPlan.findFirst({
    where: { courseId: course.id },
    orderBy: { order: 'desc' },
  });
  const order = typeof body.order === 'number' ? body.order : (last?.order ?? -1) + 1;

  const plan = await prisma.pricingPlan.create({
    data: {
      courseId: course.id,
      name,
      description,
      accessPeriod,
      accessDays: PERIOD_DAYS[accessPeriod],
      price,
      currency,
      isActive,
      isRecommended,
      order,
    },
  });
  return NextResponse.json({ plan }, { status: 201 });
}
