import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, verifyPassword } from '@/app/lib/wholesale-auth';
import { currentAccount, serviceClient } from '@/app/lib/wholesale-server';

export const MIN_PASSWORD_LENGTH = 10;

export async function POST(request: NextRequest) {
  const supabase = serviceClient();
  const account = await currentAccount(supabase);
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json().catch(() => ({}));
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return NextResponse.json({ error: '入力内容をご確認ください。' }, { status: 400 });
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `新しいパスワードは${MIN_PASSWORD_LENGTH}文字以上にしてください。` },
      { status: 400 },
    );
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: '現在のパスワードとは別のものにしてください。' }, { status: 400 });
  }

  // The hash isn't on AccountRecord — a password change is the only thing that
  // needs it, so it's fetched here rather than on every request.
  const { data: row } = await supabase
    .from('wholesale_accounts')
    .select('password_hash')
    .eq('code', account.code)
    .maybeSingle();

  if (!row || !(await verifyPassword(currentPassword, row.password_hash))) {
    return NextResponse.json({ error: '現在のパスワードが正しくありません。' }, { status: 401 });
  }

  const { error } = await supabase
    .from('wholesale_accounts')
    .update({ password_hash: await hashPassword(newPassword), must_change_password: false })
    .eq('code', account.code);

  if (error) {
    console.error('[wholesale] password update failed:', error);
    return NextResponse.json({ error: 'パスワードを変更できませんでした。' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
