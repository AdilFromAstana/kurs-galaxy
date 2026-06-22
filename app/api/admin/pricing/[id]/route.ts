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
  const plan = await prisma.pricingPlan.findUnique({ where: { id: params.id } });
  if (!plan) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ plan });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (typeof body.description === 'string' || body.description === null) data.description = body.description;
  if (typeof body.price === 'number' && body.price >= 0) data.price = body.price;
  if (typeof body.currency === 'string') data.currency = body.currency;
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
  if (typeof body.isRecommended === 'boolean') data.isRecommended = body.isRecommended;
  if (typeof body.order === 'number') data.order = body.order;
  if (PERIODS.includes(body.accessPeriod)) {
    data.accessPeriod = body.accessPeriod as AccessPeriodType;
    data.accessDays = PERIOD_DAYS[body.accessPeriod as AccessPeriodType];
  }
  const plan = await prisma.pricingPlan.update({ where: { id: params.id }, data });
  return NextResponse.json({ plan });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  await prisma.pricingPlan.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
