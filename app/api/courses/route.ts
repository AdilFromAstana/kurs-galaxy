import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Админ видит все курсы (включая черновики), все остальные — только опубликованные.
  const admin = await getAdminSession();
  const where = admin ? {} : { published: true };

  const courses = await prisma.course.findMany({
    where,
    include: {
      pricingPlans: { where: { isActive: true }, orderBy: { order: 'asc' } },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: { materials: true, photos: { orderBy: { order: 'asc' } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ courses });
}
