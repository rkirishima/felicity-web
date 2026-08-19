import { NextResponse } from 'next/server';
import { WHOLESALE_COOKIE } from '@/app/lib/wholesale-auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(WHOLESALE_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
