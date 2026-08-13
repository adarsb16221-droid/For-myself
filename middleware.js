import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'fallback-secret-key-for-dev-only-change-it';
const key = new TextEncoder().encode(secretKey);

export async function middleware(request) {
  const sessionCookie = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/login', '/signup', '/forgot-password', '/api/auth/login', '/api/auth/signup', '/api/auth/forgot-password', '/api/auth/reset-password'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If there's no session and the user is trying to access a protected route
  if (!sessionCookie && !isPublicRoute) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there's a session, verify it
  if (sessionCookie) {
    try {
      await jwtVerify(sessionCookie, key, {
        algorithms: ['HS256'],
      });

      // If user is already logged in and tries to access login/signup, redirect to dashboard
      if (pathname === '/login' || pathname === '/signup') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      // Invalid token
      if (!isPublicRoute) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
