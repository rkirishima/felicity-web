import { randomInt } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { MIN_PASSWORD_LENGTH, hashPassword } from '@/app/lib/wholesale-auth';
import { DEFAULT_MIN_ORDER_KG } from '@/app/lib/wholesale';
import { serviceClient } from '@/app/lib/wholesale-server';
import { approvalUrl, sendApplicationReceivedEmail } from '@/lib/wholesale-application';
import { notifyWholesaleApplicationToTelegram } from '@/lib/telegram';

// HP の業販ページからの新規申し込み。アカウントは active=false で作り、
// 承認（/wholesale/approve）されるまでログインしても卸価格は見えない。
// 価格・最低ロット・納品方法は標準の条件で作る。個別の条件はあとで
// scripts/create-wholesale-account.mjs で上書きする。

const MAX_LEN = 200;
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function field(body: Record<string, unknown>, key: string): string {
  const v = body[key];
  return typeof v === 'string' ? v.trim().slice(0, MAX_LEN) : '';
}

// 取引先コードは注文番号（WS-<code>-…）にも入るので、短い英数字にする。
function newCode(): string {
  let s = 'W';
  for (let i = 0; i < 5; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return s;
}

export async function POST(request: NextRequest) {
  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;

  // 人には見えない欄。埋まっていたらボットとみなし、成功したふりをして捨てる。
  if (field(body, 'website')) return NextResponse.json({ ok: true });

  const company = field(body, 'company');
  const storeName = field(body, 'storeName');
  const contactName = field(body, 'contactName');
  const email = field(body, 'email').toLowerCase();
  const phone = field(body, 'phone');
  const postalCode = field(body, 'postalCode');
  const prefecture = field(body, 'prefecture');
  const city = field(body, 'city');
  const streetAddress = field(body, 'streetAddress');
  const building = field(body, 'building');
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 2000) : '';
  const password = typeof body.password === 'string' ? body.password : '';

  const missing = [
    [company, '会社名'],
    [storeName, '店舗名'],
    [contactName, 'ご担当者名'],
    [email, 'メールアドレス'],
    [phone, '電話番号'],
    [postalCode, '郵便番号'],
    [prefecture, '都道府県'],
    [city, '市区町村'],
    [streetAddress, '番地'],
  ].filter(([v]) => !v).map(([, label]) => label);
  if (missing.length) {
    return NextResponse.json({ error: `${missing.join('・')}を入力してください。` }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'メールアドレスをご確認ください。' }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `パスワードは${MIN_PASSWORD_LENGTH}文字以上にしてください。` }, { status: 400 });
  }

  const supabase = serviceClient();
  const passwordHash = await hashPassword(password);

  let code = '';
  for (let attempt = 0; attempt < 5 && !code; attempt++) {
    const candidate = newCode();
    const { error } = await supabase.from('wholesale_accounts').insert({
      code: candidate,
      company,
      store_name: storeName,
      contact_name: contactName,
      email,
      phone,
      password_hash: passwordHash,
      postal_code: postalCode,
      prefecture,
      city,
      street_address: streetAddress,
      building: building || null,
      special_prices: {},
      min_order_kg: DEFAULT_MIN_ORDER_KG,
      extra_beans: [],
      free_shipping: false,
      delivery_method: 'shipping',
      must_change_password: false,
      // 承認メールが「ご利用開始」の案内を兼ねるので、手動の案内メールは送らない。
      welcome_email: false,
      active: false,
      application_note: note || null,
      applied_at: new Date().toISOString(),
    });

    if (!error) {
      code = candidate;
    } else if (error.code === '23505' && error.message.includes('email')) {
      return NextResponse.json(
        { error: 'このメールアドレスはすでに登録されています。ログイン画面からお入りいただくか、info@felicity.cafe までご連絡ください。' },
        { status: 409 },
      );
    } else if (error.code !== '23505') {
      console.error('[wholesale] signup insert failed:', error);
      return NextResponse.json({ error: 'お申し込みを保存できませんでした。時間をおいてお試しください。' }, { status: 500 });
    }
    // コードの衝突だけは作り直して再試行する。
  }
  if (!code) {
    return NextResponse.json({ error: 'お申し込みを保存できませんでした。時間をおいてお試しください。' }, { status: 500 });
  }

  await Promise.all([
    notifyWholesaleApplicationToTelegram({
      company,
      storeName,
      contactName,
      email,
      phone,
      address: `〒${postalCode} ${prefecture}${city}${streetAddress}${building ? ` ${building}` : ''}`,
      note: note || null,
      approveUrl: approvalUrl(code),
    }),
    sendApplicationReceivedEmail({ email, contactName, storeName }),
  ]);

  return NextResponse.json({ ok: true });
}
