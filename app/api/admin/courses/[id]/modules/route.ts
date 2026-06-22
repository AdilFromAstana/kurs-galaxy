import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const course = await prisma.course.findFirst({
    where: { OR: [{ id: params.id }, { slug: params.id }] },
  });
  if (!course) return NextResponse.json({ error: 'course_not_found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const last = await prisma.module.findFirst({
    where: { courseId: course.id },
    orderBy: { order: 'desc' },
  });
  const order = typeof body.order === 'number' ? body.order : (last?.order ?? -1) + 1;

  const module = await prisma.module.create({
    data: { courseId: course.id, title, description, order },
  });
  return NextResponse.json({ module }, { status: 201 });
}
