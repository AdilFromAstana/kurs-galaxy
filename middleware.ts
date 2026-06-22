import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, COOKIE_NAMES, type AdminSession, type UserSession } from '@/lib/auth/session';

const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ===== Админка =====
  if (pathname.startsWith('/admin')) {
    const cookie = request.cookies.get(COOKIE_NAMES.ADMIN)?.value;
    const session = cookie ? await verifyToken<AdminSession>(cookie) : null;
    const valid = session && session.kind === 'admin' && session.expiresAt > Date.now();

    if (pathname === '/admin/login') {
      if (valid) return NextResponse.redirect(new URL('/admin', request.url));
      return NextResponse.next();
    }
    if (!valid) {
      const res = NextResponse.redirect(new URL('/admin/login', request.url));
      if (cookie) res.cookies.delete(COOKIE_NAMES.ADMIN);
      return res;
    }
    return NextResponse.next();
  }

  // ===== Защищённые студенческие маршруты =====
  // /courses, /course/[id], /cert/verify/[id] и /lesson/[id] доступны гостям —
  // на странице /lesson дальше идёт серверная проверка lesson.isFree:
  // бесплатный — открыт всем, платный — гостю предлагается регистрация/покупка.
  const needsAuth =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile');

  if (needsAuth) {
    const cookie = request.cookies.get(COOKIE_NAMES.USER)?.value;
    const session = cookie ? await verifyToken<UserSession>(cookie) : null;
    const valid = session && session.kind === 'user' && session.expiresAt > Date.now();
    if (!valid) {
      const res = NextResponse.redirect(new URL('/auth/login', request.url));
      if (cookie) res.cookies.delete(COOKIE_NAMES.USER);
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
  ],
};
