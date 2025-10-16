import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /dashboard, /login)
  const { pathname } = request.nextUrl;

  // Check if the user is trying to access the dashboard
  if (pathname.startsWith('/dashboard')) {
    // In a real app, you would check for a valid JWT token or session
    // For this demo, we'll let the client-side handle the redirect
    // since we're using localStorage for authentication state
    return NextResponse.next();
  }

  // Allow access to login page
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // Redirect root to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
