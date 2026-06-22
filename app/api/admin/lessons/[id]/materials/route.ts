import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';

const ALLOWED = ['PDF', 'LINK', 'PRODUCT'] as const;
type MaterialKind = (typeof ALLOWED)[number];

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const lesson = await prisma.lesson.findUnique({ where: { id: params.id } });
  if (!lesson) return NextResponse.json({ error: 'lesson_not_found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? '').trim();
  const url = String(body.url ?? '').trim();
  const rawType = String(body.type ?? 'LINK').toUpperCase();
  const type: MaterialKind = ALLOWED.includes(rawType as MaterialKind) ? (rawType as MaterialKind) : 'LINK';

  if (!title || !url) return NextResponse.json({ error: 'title and url required' }, { status: 400 });

  const material = await prisma.material.create({ data: { lessonId: lesson.id, title, url, type } });
  return NextResponse.json({ material }, { status: 201 });
}
