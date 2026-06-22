import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export async function GET() {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const [courses, students, lessons, modules, purchases] = await Promise.all([
    prisma.course.count(),
    prisma.user.count(),
    prisma.lesson.count(),
    prisma.module.count(),
    prisma.purchase.count({ where: { status: 'ACTIVE' } }),
  ]);
  return NextResponse.json({ courses, students, lessons, modules, activePurchases: purchases });
}
