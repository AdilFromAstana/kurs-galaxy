import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, getUserSession } from '@/lib/auth/session';
import { accessibleCourseIds } from '@/lib/courseAccess';

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
            include: {
              materials: true,
              photos: { orderBy: { order: 'asc' } },
              videos: { orderBy: { order: 'asc' } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  if (admin) return NextResponse.json({ courses });

  // Содержимое платных уроков (текст, видео, фото, материалы) — только тем, у кого
  // есть доступ к курсу. Остальным — названия уроков для программы курса.
  // Раньше уроки целиком отдавались всем, и ссылки на видео можно было достать без покупки.
  const user = await getUserSession();
  const allowed = user ? await accessibleCourseIds(user.userId) : new Set<string>();

  const safe = courses.map((c) => {
    const open = c.isFree || allowed.has(c.id);
    return {
      ...c,
      modules: c.modules.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) =>
          open || l.isFree
            ? l
            : { ...l, content: '', videoUrl: '', videos: [], materials: [], photos: [], locked: true },
        ),
      })),
    };
  });
  return NextResponse.json({ courses: safe });
}
