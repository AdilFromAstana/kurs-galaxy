import { prisma } from '@/lib/db';

/** Курсы, к которым у ученицы сейчас есть доступ: активная и не истёкшая покупка (или выдача по ссылке). */
export async function accessibleCourseIds(userId: string): Promise<Set<string>> {
  const now = new Date();
  const rows = await prisma.purchase.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { courseId: true },
  });
  return new Set(rows.map((r) => r.courseId));
}
