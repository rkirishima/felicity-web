import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  SESSION_MAX_AGE,
  WHOLESALE_COOKIE,
  signSession,
  verifyPassword,
} from '@/app/lib/wholesale-auth';

// A throwaway hash verified when the address is unknown, so a wrong address and
// a wrong password take the same time and the login form can't be used to
// enumerate which companies we supply.
const DUMMY_HASH =
  'pbkdf2$210000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json().catch(() => ({ email: '', password: '' }));
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return NextResponse.json({ error: 'メールアドレスとパスワードを入力してください。' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Stored addresses are normalised to lowercase (see migration 011), so an
  // exact match on the normalised input is enough — and unlike ILIKE it can't
  // be tricked by `_` or `%` inside an address.
  const { data: account } = await supabase
    .from('wholesale_accounts')
    .select('code, company, password_hash, active')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  const ok = await verifyPassword(password, account?.password_hash ?? DUMMY_HASH);

  if (!account || !account.active || !ok) {
    return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません。' }, { status: 401 });
  }

  const token = await signSession({ code: account.code, company: account.company });
  if (!token) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  await supabase
    .from('wholesale_accounts')
    .update({ last_login_at: new Date().toISOString() })
    .eq('code', account.code);

  const response = NextResponse.json({ ok: true, company: account.company });
  response.cookies.set(WHOLESALE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  return response;
}
