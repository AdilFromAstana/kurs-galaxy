import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'nail_admin_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Проверяем только админские роуты
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  // Публичные роуты админки
  if (pathname === '/admin/login') {
    const session = request.cookies.get(SESSION_COOKIE);
    
    // Если уже авторизован, редирект на dashboard
    if (session) {
      try {
        const sessionData = JSON.parse(session.value);
        // Проверка срока действия
        if (sessionData.expiresAt > Date.now()) {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      } catch {
        // Невалидная сессия, удаляем cookie
        const response = NextResponse.next();
        response.cookies.delete(SESSION_COOKIE);
        return response;
      }
    }
    
    return NextResponse.next();
  }
  
  // Защищенные роуты
  const session = request.cookies.get(SESSION_COOKIE);
  
  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  
  // Проверка срока действия
  try {
    const sessionData = JSON.parse(session.value);
    if (sessionData.expiresAt < Date.now()) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
  } catch {
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
