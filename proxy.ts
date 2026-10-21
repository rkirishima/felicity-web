import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { WHOLESALE_COOKIE, verifySession } from '@/app/lib/wholesale-auth';

// 価格の出ない公開ページ。完全一致でしか通さない。ここを前方一致にすると
// /wholesale/order まで素通りして卸価格が漏れる。
const WHOLESALE_PUBLIC_EXACT = ['/wholesale'];

// Paths inside the wholesale area that must stay reachable without a session,
// otherwise signing in would require already being signed in.
//
// signup は新規の申し込み。approve は Telegram の承認リンクから開く画面で、
// セッションではなく URL の署名（lib/wholesale-application.ts）で守っている。
const WHOLESALE_PUBLIC = [
  '/wholesale/login',
  '/api/wholesale/login',
  '/wholesale/signup',
  '/api/wholesale/signup',
  '/wholesale/approve',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/wholesale') || pathname.startsWith('/api/wholesale')) {
    if (
      WHOLESALE_PUBLIC_EXACT.includes(pathname) ||
      WHOLESALE_PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    ) {
      return NextResponse.next();
    }

    const session = await verifySession(request.cookies.get(WHOLESALE_COOKIE)?.value);
    if (session) return NextResponse.next();

    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/wholesale/login', request.url));
  }

  // /doug と /seo — single shared secret, hidden rather than redirected.
  // SEOコーチは Claude API とクロールを動かすので、公開したままにはしない。
  // 専用の秘密鍵を増やすとスタッフに配る鍵が2本になるため、Doug と同じ
  // doug_session（path:'/' で発行済み）をそのまま入館証として使う。
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
    '/seo/:path*',
    '/api/seo/:path*',
    '/wholesale/:path*',
    '/api/wholesale/:path*',
  ],
};
