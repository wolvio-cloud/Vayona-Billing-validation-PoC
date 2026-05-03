import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// In a real app, we would verify a JWT or session cookie here.
// For the PoC, we check for a 'wolvio-auth' cookie.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = request.cookies.has('wolvio-auth')

  // Public paths
  if (pathname === '/login' || pathname === '/welcome' || pathname === '/favicon.ico') {
    if (isAuthenticated && pathname !== '/welcome') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // API paths - allow for now
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Protected paths
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/welcome', request.url))
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
