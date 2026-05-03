import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware secures the dashboard and handles redirects
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = request.cookies.has('wolvio-auth')

  // 1. Allow public assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  // 2. Handle Authentication
  if (!isAuthenticated) {
    // If not logged in, only allow /login and /welcome
    if (pathname !== '/login' && pathname !== '/welcome') {
      return NextResponse.redirect(new URL('/welcome', request.url))
    }
  } else {
    // If logged in, redirect away from auth pages to dashboard
    if (pathname === '/login' || pathname === '/welcome') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // If logged in and at root, go to dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
