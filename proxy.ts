import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg|icons.svg|api/auth).*)'],
};
