import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isAppPage = request.nextUrl.pathname.startsWith('/dashboard') ||
                   request.nextUrl.pathname.startsWith('/live') ||
                   request.nextUrl.pathname.startsWith('/persons') ||
                   request.nextUrl.pathname.startsWith('/events') ||
                   request.nextUrl.pathname.startsWith('/analytics') ||
                   request.nextUrl.pathname.startsWith('/reports') ||
                   request.nextUrl.pathname.startsWith('/alerts') ||
                   request.nextUrl.pathname.startsWith('/cameras') ||
                   request.nextUrl.pathname.startsWith('/settings') ||
                   request.nextUrl.pathname.startsWith('/test-detection')

  // Redirect to login if trying to access app pages without token
  if (isAppPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if trying to access login with token
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
