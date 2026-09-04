import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

export async function GET() {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const courses = await prisma.course.findMany({
    include: {
      pricingPlans: { orderBy: { order: 'asc' } },
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
      creator: { select: { id: true, name: true, email: true } },
      _count: { select: { purchases: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ courses });
}

export async function POST(req: Request) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const body = await req.json().catch(() => ({}));
  const slug = String(body.slug ?? '').trim();
  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  const thumbnailUrl =
    typeof body.thumbnailUrl === 'string' && body.thumbnailUrl.trim()
      ? body.thumbnailUrl.trim()
      : null;

  if (!slug || !title) {
    return NextResponse.json({ error: 'slug and title required' }, { status: 400 });
  }
  const exists = await prisma.course.findUnique({ where: { slug } });
  if (exists) {
    return NextResponse.json({ error: 'Курс с таким slug уже существует' }, { status: 409 });
  }

  // Создатель — текущий залогиненный админ
  const course = await prisma.course.create({
    data: { slug, title, description, thumbnailUrl, creatorId: r.session.id },
  });
  return NextResponse.json({ course }, { status: 201 });
}
