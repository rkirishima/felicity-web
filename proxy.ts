import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const cookie = request.cookies.get('doug_session')?.value;
  const secret = process.env.DOUG_ACCESS_SECRET;

  if (!secret || !cookie || cookie !== secret) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/doug/:path*', '/api/doug/:path*'],
};
