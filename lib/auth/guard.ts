import { NextResponse } from 'next/server';
import { getAdminSession, getUserSession, type AdminSession, type UserSession } from '@/lib/auth/session';

export async function requireAdmin(): Promise<{ session: AdminSession } | { response: NextResponse }> {
  const session = await getAdminSession();
  if (!session) return { response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  return { session };
}

export async function requireUser(): Promise<{ session: UserSession } | { response: NextResponse }> {
  const session = await getUserSession();
  if (!session) return { response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  return { session };
}
