import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const courseId = params.id;

  const [revenueAgg, purchasers, totalLessons] = await Promise.all([
    prisma.purchase.aggregate({
      where: {
        courseId,
        paymentStatus: 'COMPLETED',
        paymentMethod: { not: 'admin_manual' },
      },
      _sum: { paymentAmount: true },
    }),
    prisma.purchase.findMany({
      where: { courseId },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.lesson.count({ where: { module: { courseId } } }),
  ]);

  const studentIds = purchasers.map((p) => p.userId);
  let completionRate = 0;

  if (studentIds.length > 0 && totalLessons > 0) {
    const progressCounts = await prisma.progress.groupBy({
      by: ['userId'],
      where: { courseId, userId: { in: studentIds } },
      _count: { lessonId: true },
    });
    const sumPercent = studentIds.reduce((sum, uid) => {
      const rec = progressCounts.find((p) => p.userId === uid);
      const completed = rec?._count.lessonId ?? 0;
      return sum + Math.min(100, Math.round((completed / totalLessons) * 100));
    }, 0);
    completionRate = Math.round(sumPercent / studentIds.length);
  }

  return NextResponse.json({
    revenue: revenueAgg._sum.paymentAmount ?? 0,
    students: studentIds.length,
    completionRate,
  });
}
