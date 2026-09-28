#!/usr/bin/env node
// Issues a new temporary password for an existing wholesale (業販) account.
//
//   node scripts/reset-wholesale-password.mjs --code CARBS
//   node scripts/reset-wholesale-password.mjs --code CARBS --password 'decided-by-hand'
//   node scripts/reset-wholesale-password.mjs --code CARBS --email
//
// --email を付けると、発行したパスワードをその取引先へメールで送る。案内メール
// (send-wholesale-welcome.mjs) が「別便でお送りします」と書いているのがこれ。
// 仮のパスワードで、初回ログイン時に本人が変更する前提なので、メールに載せる。
//
// パスワードを省略すると読み上げやすい文字だけで生成する（取引先に電話や
// LINE で伝える前提のため、l/1/O/0 のような紛らわしい文字を除いてある）。
//
// アカウントの他の項目（価格・最低ロット・納品先など）には触らない。
// must_change_password を立て直すので、取引先は次のログインで自分の
// パスワードに変更することになる。

import { readFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// next dev reads .env.local; plain `node` does not, so load it by hand.
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const PBKDF2_ITERATIONS = 210_000;

function toBase64Url(bytes) {
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// 紛らわしい文字を除いた語で「felicity-brew-4821」のような形にする。
function generatePassword() {
  const words = [
    'coffee', 'roast', 'hayama', 'filter', 'espresso', 'aroma', 'harvest',
    'cherry', 'origin', 'kettle', 'grinder', 'brew', 'sunrise', 'ember',
  ];
  const pick = () => words[crypto.getRandomValues(new Uint32Array(1))[0] % words.length];
  const digits = String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(4, '0');
  return `${pick()}-${pick()}-${digits}`;
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, key, 256);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(new Uint8Array(bits))}`;
}

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const k = process.argv[i].replace(/^--/, '');
  if (k === 'email') {
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const code = args.code.trim().toUpperCase();
const password = args.password ?? generatePassword();

const supabase = createClient(url, serviceKey);

// 発行の前に対象を確かめる。先に書き換えてから送信を断ると、誰も知らない
// パスワードだけが残ってしまう。
const { data: target, error: lookupError } = await supabase
  .from('wholesale_accounts')
  .select('code, company, contact_name, email, welcome_email')
  .eq('code', code)
  .maybeSingle();

if (lookupError) {
  console.error('Failed:', lookupError.message);
  process.exit(1);
}
if (!target) {
  console.error(`取引先コード ${code} が見つかりません`);
  process.exit(1);
}
if (args.email && target.welcome_email === false) {
  console.error(`${target.code}（${target.company}）はメール送信の対象外に設定されています。パスワードは変更していません。`);
  process.exit(1);
}

const { data, error } = await supabase
  .from('wholesale_accounts')
  .update({ password_hash: await hashPassword(password), must_change_password: true })
  .eq('code', code)
  .select('code, company, contact_name, email, welcome_email')
  .maybeSingle();

if (error) {
  console.error('Failed:', error.message);
  process.exit(1);
}
if (!data) {
  console.error(`取引先コード ${code} が見つかりません`);
  process.exit(1);
}

console.log(`✅ ${data.code} — ${data.company}`);
console.log(`   ログインID: ${data.email}`);
console.log(`   初期パスワード: ${password}`);
console.log('   初回ログイン時に、取引先自身がパスワードを変更します。');

if (!args.email) process.exit(0);

const greeting = data.contact_name ? `${data.contact_name} 様` : `${data.company} ご担当者様`;
const text = [
  greeting,
  '',
  '先ほどご案内した業販ページのパスワードを、別便にてお送りします。',
  '',
  '▼ ログインページ',
  'https://felicity.cafe/wholesale/login',
  '',
  `ログインID：${data.email}`,
  `パスワード：${password}`,
  '',
  'こちらは仮のパスワードです。初回ログイン時に、お客様ご自身のパスワードへの変更をお願いしております。',
  '',
  'ご不明な点がございましたら、このメールにご返信ください。',
  '',
  'FELICITY COFFEE ROASTERS',
  '〒240-0115 神奈川県三浦郡葉山町上山口2432-3',
  'info@felicity.cafe / 080-8758-4368',
].join('\n');

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const html = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #2C2416; max-width: 560px; margin: 0 auto; padding: 24px; line-height: 1.8;">
  <div style="border-bottom: 2px solid #2C2416; padding-bottom: 16px; margin-bottom: 24px;">
    <p style="font-size: 13px; letter-spacing: 0.2em; color: #8C7B6B; margin: 0;">FELICITY COFFEE ROASTERS</p>
  </div>
  <p style="font-size: 15px;">${esc(greeting)}</p>
  <p style="font-size: 15px;">先ほどご案内した業販ページのパスワードを、別便にてお送りします。</p>
  <table style="font-size: 15px; margin: 20px 0; border-collapse: collapse;">
    <tr><td style="padding: 6px 16px 6px 0; color: #8C7B6B;">ログインページ</td><td style="padding: 6px 0;"><a href="https://felicity.cafe/wholesale/login" style="color: #2E4A3E;">felicity.cafe/wholesale/login</a></td></tr>
    <tr><td style="padding: 6px 16px 6px 0; color: #8C7B6B;">ログインID</td><td style="padding: 6px 0;">${esc(data.email)}</td></tr>
    <tr><td style="padding: 6px 16px 6px 0; color: #8C7B6B;">パスワード</td><td style="padding: 6px 0; font-family: monospace; font-size: 16px;">${esc(password)}</td></tr>
  </table>
  <p style="font-size: 14px; color: #8C7B6B;">こちらは仮のパスワードです。初回ログイン時に、お客様ご自身のパスワードへの変更をお願いしております。</p>
  <p style="font-size: 15px;">ご不明な点がございましたら、このメールにご返信ください。</p>
  <div style="border-top: 1px solid #DDD5C5; margin-top: 32px; padding-top: 16px; font-size: 13px; color: #8C7B6B;">
    <p style="margin: 0;">FELICITY COFFEE ROASTERS<br>
    〒240-0115 神奈川県三浦郡葉山町上山口2432-3<br>
    info@felicity.cafe / 080-8758-4368</p>
  </div>
</body>
</html>`;

const resend = new Resend(process.env.RESEND_API_KEY);
const { data: sent, error: sendErr } = await resend.emails.send({
  from: 'FELICITY COFFEE ROASTERS <info@felicity.cafe>',
  to: data.email,
  replyTo: 'info@felicity.cafe',
  subject: '業販ページのパスワード｜FELICITY COFFEE ROASTERS',
  text,
  html,
});

if (sendErr) {
  console.error('   送信失敗:', JSON.stringify(sendErr));
  process.exit(1);
}
console.log(`   ✉️  ${data.email} に送信しました — id=${sent?.id}`);
