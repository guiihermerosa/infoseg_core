import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('infoseg_token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicRoutes = ['/login', '/visitor', '/register', '/support'];
  const isPublic = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublic) {
    return NextResponse.next();
  }

  // Check if token exists (basic check — full validation happens server-side)
  if (!token) {
    // Also check localStorage via a different approach — since middleware runs on server,
    // we can't access localStorage. The client-side useAuth hook handles redirection.
    // For SSR protection, rely on token in cookie or just allow and let client redirect.
    return NextResponse.next();
  }

  // Role-based route protection
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload.role;

    // Residents can't access concierge routes (support has same access as concierge)
    if (pathname.startsWith('/concierge') && role !== 'concierge' && role !== 'support') {
      return NextResponse.redirect(new URL('/resident/dashboard', request.url));
    }

    // Concierges/support can't access resident routes
    if (pathname.startsWith('/resident') && role !== 'resident') {
      return NextResponse.redirect(new URL('/concierge/cameras', request.url));
    }
  } catch {
    // Invalid token — let client-side handle
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|visitor).*)',
  ],
};
