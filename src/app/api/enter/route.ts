import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('k');
  const secret = process.env.DOUG_ACCESS_SECRET;

  if (!secret || !key || key !== secret) {
    return new NextResponse(null, { status: 404 });
  }

  const response = NextResponse.redirect(new URL('/doug', request.url));
  response.cookies.set('doug_session', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 90, // 90 days
    path: '/',
  });

  return response;
}
