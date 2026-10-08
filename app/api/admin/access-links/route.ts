import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';
import { newToken } from '@/lib/accessLinks';

export const dynamic = 'force-dynamic';

// GET — все ссылки-приглашения: курс, для кого, сколько раз активировали и кто
export async function GET() {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const links = await prisma.accessLink.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      course: { select: { id: true, title: true, isFree: true, published: true } },
      purchases: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  return NextResponse.json({ links });
}

// POST { courseId, note?, accessDays?, maxUses? } — создать ссылку
export async function POST(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const body = await req.json().catch(() => ({}));
  const courseId = String(body.courseId ?? '');
  const course = courseId ? await prisma.course.findUnique({ where: { id: courseId } }) : null;
  if (!course) return NextResponse.json({ error: 'course_not_found', message: 'Выберите курс' }, { status: 400 });

  const days = Number(body.accessDays);
  const uses = Number(body.maxUses);
  const link = await prisma.accessLink.create({
    data: {
      token: newToken(),
      courseId,
      note: typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 200) : null,
      accessDays: Number.isInteger(days) && days > 0 && days <= 3650 ? days : null,
      maxUses: Number.isInteger(uses) && uses >= 0 && uses <= 10000 ? uses : 1,
    },
  });
  return NextResponse.json({ link }, { status: 201 });
}
