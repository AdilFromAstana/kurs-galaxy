import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

async function findCourse(idOrSlug: string) {
  return prisma.course.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: {
      pricingPlans: { orderBy: { order: 'asc' } },
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' }, include: { materials: true } } },
      },
      creator: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const course = await findCourse(params.id);
  if (!course) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ course });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof body.slug === 'string' && body.slug.trim()) data.slug = body.slug.trim();
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
  if (typeof body.description === 'string') data.description = body.description;
  if (typeof body.published === 'boolean') data.published = body.published;

  const existing = await findCourse(params.id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (data.slug && data.slug !== existing.slug) {
    const conflict = await prisma.course.findUnique({ where: { slug: String(data.slug) } });
    if (conflict) return NextResponse.json({ error: 'slug занят' }, { status: 409 });
  }

  const course = await prisma.course.update({ where: { id: existing.id }, data });
  return NextResponse.json({ course });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const existing = await findCourse(params.id);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await prisma.course.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
