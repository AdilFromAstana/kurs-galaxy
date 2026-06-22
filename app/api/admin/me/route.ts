import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guard';

export async function GET() {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  return NextResponse.json({ admin: r.session });
}
