#!/usr/bin/env node
// Sends the "業販お取引開始のご案内" email to a wholesale account.
//
//   node scripts/send-wholesale-welcome.mjs --code CARBS --dry-run
//   node scripts/send-wholesale-welcome.mjs --code CARBS
//
// 本文は取引先の設定から組み立てる（最低ロット・納品方法・限定銘柄）ので、
// 取引先ごとに書き分ける必要はない。
//
// パスワードは本文に含めない。メールが漏れた時点でIDとパスワードの両方が
// 漏れることになるため、LINE や電話など別の経路で伝える。

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const k = process.argv[i].replace(/^--/, '');
  // --dry-run のような値を取らないフラグ
  if (k === 'dry-run') {
    args[k] = true;
    i -= 1;
    continue;
  }
  args[k] = process.argv[i + 1];
}

if (!args.code) {
  console.error('Missing required arg: --code');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data: account, error } = await supabase
  .from('wholesale_accounts')
  .select('code, company, contact_name, email, min_order_kg, delivery_method, free_shipping, extra_beans, active, welcome_email')
  .eq('code', args.code.trim().toUpperCase())
  .maybeSingle();

if (error) {
  console.error('Failed:', error.message);
  process.exit(1);
}
if (!account) {
  console.error(`取引先コード ${args.code} が見つかりません`);
  process.exit(1);
}
if (!account.active) {
  console.error(`${account.code} は停止中です`);
  process.exit(1);
}
// 既存の関係があって案内メールが不要な取引先（旭興産など）。うっかり送らないよう、
// 記憶ではなくアカウント側のフラグで止める。送るなら DB のフラグを戻すこと。
if (account.welcome_email === false) {
  console.error(`${account.code}（${account.company}）は案内メールの対象外に設定されています。`);
  process.exit(1);
}

const greeting = account.contact_name ? `${account.contact_name} 様` : `${account.company} ご担当者様`;
const minKg = account.min_order_kg ?? 3;
const handDelivery = account.delivery_method === 'hand_delivery';

const deliveryLines = handDelivery
  ? [`${account.company}様は直接お届けのため、送料・配送先のご入力は不要です`]
  : account.free_shipping
    ? ['送料は当社が負担いたします']
    : ['ご注文金額（税抜）30,000円以上で送料無料。未満の場合は箱のサイズに応じて加算されます'];

const hasSantos = (account.extra_beans ?? []).includes('brazil-santos');
const beansLine = hasSantos
  ? 'ブラジル サントス No.2（¥4,000/kg）ほか、シングルオリジン10銘柄をご用意しています。'
  : 'シングルオリジン10銘柄をご用意しています。';

const orderPoints = [
  `最低ロット：1回${minKg}kgから（1銘柄につき1kgから）`,
  ...deliveryLines,
  '挽き方や個包装のご希望は、備考欄にご記入ください（追加料金はいただきません）',
  'ご注文からお届けまで、約3日いただいております',
];

const textBody = [
  `${greeting}`,
  '',
  'いつもお世話になっております。FELICITY COFFEE ROASTERS です。',
  'このたび、業販のご注文をWEBから承れるようになりましたのでご案内いたします。',
  '',
  '▼ 専用ページ',
  'https://felicity.cafe/wholesale/login',
  '',
  `ログインID：${account.email}`,
  'パスワード：別便でお送りします',
  '',
  '初回ログイン時に、パスワードのご変更をお願いしております。',
  '',
  '▼ ご注文方法',
  'ログインすると、お取り扱い銘柄と卸価格が並んだページが開きます。ご希望の銘柄の数量を1kg単位でご指定いただき、そのままご注文ください。',
  '',
  ...orderPoints.map((p) => `・${p}`),
  '',
  '▼ お取り扱い銘柄',
  `${beansLine}産地や味わいの説明もページ内に記載しておりますので、新しい豆をお試しの際の参考になさってください。価格はすべて税抜・1kgあたりです。`,
  '',
  '焙煎度合いのご相談、オリジナルブレンドの開発（3kg〜）、抽出レシピのご提案なども承っております。お気軽にお申し付けください。',
  '',
  '引き続きよろしくお願いいたします。',
  '',
  'FELICITY COFFEE ROASTERS',
  '〒240-0115 神奈川県三浦郡葉山町上山口2432-3',
  'info@felicity.cafe / 080-8758-4368',
].join('\n');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const htmlBody = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #2C2416; max-width: 560px; margin: 0 auto; padding: 24px; line-height: 1.8;">
  <div style="border-bottom: 2px solid #2C2416; padding-bottom: 16px; margin-bottom: 24px;">
    <p style="font-size: 13px; letter-spacing: 0.2em; color: #8C7B6B; margin: 0;">FELICITY COFFEE ROASTERS</p>
  </div>

  <p style="font-size: 15px;">${esc(greeting)}</p>

  <p style="font-size: 15px;">いつもお世話になっております。FELICITY COFFEE ROASTERS です。<br>
  このたび、業販のご注文をWEBから承れるようになりましたのでご案内いたします。</p>

  <h2 style="font-size: 13px; letter-spacing: 0.12em; color: #8C7B6B; margin-top: 32px; text-transform: uppercase;">専用ページ</h2>
  <p style="font-size: 15px; margin: 8px 0 0;">
    <a href="https://felicity.cafe/wholesale/login" style="color: #2E4A3E;">https://felicity.cafe/wholesale/login</a>
  </p>
  <table style="font-size: 15px; margin-top: 12px; border-collapse: collapse;">
    <tr><td style="padding: 4px 16px 4px 0; color: #8C7B6B;">ログインID</td><td style="padding: 4px 0;">${esc(account.email)}</td></tr>
    <tr><td style="padding: 4px 16px 4px 0; color: #8C7B6B;">パスワード</td><td style="padding: 4px 0;">別便でお送りします</td></tr>
  </table>
  <p style="font-size: 14px; color: #8C7B6B;">初回ログイン時に、パスワードのご変更をお願いしております。</p>

  <h2 style="font-size: 13px; letter-spacing: 0.12em; color: #8C7B6B; margin-top: 32px; text-transform: uppercase;">ご注文方法</h2>
  <p style="font-size: 15px;">ログインすると、お取り扱い銘柄と卸価格が並んだページが開きます。ご希望の銘柄の数量を1kg単位でご指定いただき、そのままご注文ください。</p>
  <ul style="font-size: 15px; padding-left: 20px;">
    ${orderPoints.map((p) => `<li style="margin-bottom: 6px;">${esc(p)}</li>`).join('\n    ')}
  </ul>

  <h2 style="font-size: 13px; letter-spacing: 0.12em; color: #8C7B6B; margin-top: 32px; text-transform: uppercase;">お取り扱い銘柄</h2>
  <p style="font-size: 15px;">${esc(beansLine)}産地や味わいの説明もページ内に記載しておりますので、新しい豆をお試しの際の参考になさってください。価格はすべて税抜・1kgあたりです。</p>

  <p style="font-size: 15px;">焙煎度合いのご相談、オリジナルブレンドの開発（3kg〜）、抽出レシピのご提案なども承っております。お気軽にお申し付けください。</p>

  <p style="font-size: 15px;">引き続きよろしくお願いいたします。</p>

  <div style="border-top: 1px solid #DDD5C5; margin-top: 32px; padding-top: 16px; font-size: 13px; color: #8C7B6B;">
    <p style="margin: 0;">FELICITY COFFEE ROASTERS<br>
    〒240-0115 神奈川県三浦郡葉山町上山口2432-3<br>
    info@felicity.cafe / 080-8758-4368</p>
  </div>
</body>
</html>`;

const subject = '業販お取引開始のご案内｜FELICITY COFFEE ROASTERS';

if (args['dry-run']) {
  console.log(`--- DRY RUN ---`);
  console.log(`To: ${account.email}`);
  console.log(`Subject: ${subject}`);
  console.log('');
  console.log(textBody);
  process.exit(0);
}

const resend = new Resend(process.env.RESEND_API_KEY);
const { data: sent, error: sendErr } = await resend.emails.send({
  from: 'FELICITY COFFEE ROASTERS <info@felicity.cafe>',
  to: account.email,
  replyTo: 'info@felicity.cafe',
  subject,
  text: textBody,
  html: htmlBody,
});

if (sendErr) {
  console.error('送信失敗:', JSON.stringify(sendErr));
  process.exit(1);
}

console.log(`✅ ${account.company} (${account.email}) に送信しました — id=${sent?.id}`);
