#!/usr/bin/env node
// Issues a new temporary password for an existing wholesale (業販) account.
//
//   node scripts/reset-wholesale-password.mjs --code CARBS
//   node scripts/reset-wholesale-password.mjs --code CARBS --password 'decided-by-hand'
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
const { data, error } = await supabase
  .from('wholesale_accounts')
  .update({ password_hash: await hashPassword(password), must_change_password: true })
  .eq('code', code)
  .select('code, company, email')
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
