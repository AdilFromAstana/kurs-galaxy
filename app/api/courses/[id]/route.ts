import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminSession();
  // Принимаем и id, и slug
  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: params.id }, { slug: params.id }],
    },
    include: {
      pricingPlans: { where: { isActive: true }, orderBy: { order: 'asc' } },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              materials: true,
              photos: { orderBy: { order: 'asc' } },
              videos: { orderBy: { order: 'asc' } },
            },
          },
        },
      },
    },
  });
  if (!course) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Гость / юзер не должны видеть черновик
  if (!admin && !course.published) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ course });
}
