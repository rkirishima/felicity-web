import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { WHOLESALE_COOKIE, verifySession } from '@/app/lib/wholesale-auth';

// Paths inside the wholesale area that must stay reachable without a session,
// otherwise signing in would require already being signed in.
const WHOLESALE_PUBLIC = ['/wholesale/login', '/api/wholesale/login'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/wholesale') || pathname.startsWith('/api/wholesale')) {
    if (WHOLESALE_PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.next();
    }

    const session = await verifySession(request.cookies.get(WHOLESALE_COOKIE)?.value);
    if (session) return NextResponse.next();

    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/wholesale/login', request.url));
  }

  // /doug — single shared secret, hidden rather than redirected.
  const cookie = request.cookies.get('doug_session')?.value;
  const secret = process.env.DOUG_ACCESS_SECRET;

  if (!secret || !cookie || cookie !== secret) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/doug/:path*',
    '/api/doug/:path*',
    '/wholesale/:path*',
    '/api/wholesale/:path*',
  ],
};
