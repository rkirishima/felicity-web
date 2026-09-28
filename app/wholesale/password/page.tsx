import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { WHOLESALE_COOKIE, verifySession } from '@/app/lib/wholesale-auth';
import { PasswordForm } from './PasswordForm';

import type { Metadata } from 'next';

// 取引先専用。検索には出さない。
export const metadata: Metadata = {
  title: 'パスワード変更 | FELICITY COFFEE ROASTERS',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const dynamic = 'force-dynamic';

export default async function WholesalePasswordPage() {
  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(WHOLESALE_COOKIE)?.value);
  if (!session) redirect('/wholesale/login');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from('wholesale_accounts')
    .select('company, must_change_password, active')
    .eq('code', session.code)
    .maybeSingle();

  if (!data || !data.active) redirect('/wholesale/login');

  return <PasswordForm company={data.company} firstTime={data.must_change_password} />;
}
