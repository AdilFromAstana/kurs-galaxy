import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      purchases: {
        orderBy: { purchasedAt: 'desc' },
        include: {
          plan: true,
          course: { select: { id: true, slug: true, title: true } },
        },
      },
      progress: {
        select: {
          courseId: true,
          lessonId: true,
          completedAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // Прогресс агрегируем по курсам
  const progressByCourse = new Map<string, number>();
  for (const p of user.progress) {
    progressByCourse.set(
      p.courseId,
      (progressByCourse.get(p.courseId) ?? 0) + 1,
    );
  }

  // Считаем общее число уроков для каждого курса, в котором есть прогресс или покупка
  const courseIds = new Set<string>([
    ...user.purchases.map((p) => p.courseId),
    ...user.progress.map((p) => p.courseId),
  ]);

  const courseTotals = await prisma.course.findMany({
    where: { id: { in: Array.from(courseIds) } },
    select: {
      id: true,
      title: true,
      slug: true,
      modules: { select: { _count: { select: { lessons: true } } } },
    },
  });

  const totalLessonsByCourse = new Map<string, number>();
  for (const c of courseTotals) {
    totalLessonsByCourse.set(
      c.id,
      c.modules.reduce((sum, m) => sum + m._count.lessons, 0),
    );
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
    purchases: user.purchases,
    progressByCourse: Array.from(courseIds).map((courseId) => {
      const c = courseTotals.find((x) => x.id === courseId);
      return {
        courseId,
        courseTitle: c?.title ?? 'Курс удалён',
        completed: progressByCourse.get(courseId) ?? 0,
        total: totalLessonsByCourse.get(courseId) ?? 0,
      };
    }),
  });
}
