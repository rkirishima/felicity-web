#!/usr/bin/env node
// Creates or updates a wholesale (業販) trade account.
//
//   node scripts/create-wholesale-account.mjs \
//     --code JOLT --company "JOLT the COFFEE" --contact "粂原 茂人" \
//     --email jolt@example.com --password 'xxxxxxxx' \
//     --special-standard 5200 --special-premium 6000
//
// The password is hashed here and only the hash is stored. The stored format
// must stay in sync with `hashPassword` in app/lib/wholesale-auth.ts.

import 'dotenv/config';
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

const required = ['code', 'company', 'email', 'password'];
const missing = required.filter((k) => !args[k]);
if (missing.length) {
  console.error(`Missing required arg(s): ${missing.map((m) => `--${m}`).join(', ')}`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const row = {
  code: args.code.trim().toUpperCase(),
  company: args.company,
  contact_name: args.contact ?? null,
  email: args.email,
  phone: args.phone ?? null,
  password_hash: await hashPassword(args.password),
  postal_code: args['postal-code'] ?? null,
  prefecture: args.prefecture ?? null,
  city: args.city ?? null,
  street_address: args['street-address'] ?? null,
  building: args.building ?? null,
  special_price_economy: args['special-economy'] ? Number(args['special-economy']) : null,
  special_price_standard: args['special-standard'] ? Number(args['special-standard']) : null,
  special_price_premium: args['special-premium'] ? Number(args['special-premium']) : null,
  free_shipping: args['free-shipping'] === 'true',
  delivery_method: args['delivery'] === 'hand' ? 'hand_delivery' : 'shipping',
  // 発行・再発行したパスワードは常に一時的なもの。取引先が自分で決め直すまで注文画面には入れない。
  must_change_password: true,
  active: args.active !== 'false',
  notes: args.notes ?? null,
};

const supabase = createClient(url, serviceKey);
const { error } = await supabase.from('wholesale_accounts').upsert(row, { onConflict: 'code' });

if (error) {
  console.error('Failed:', error.message);
  process.exit(1);
}

console.log(`✅ ${row.code} — ${row.company}`);
console.log('   初期パスワードです。取引先の初回ログイン時に本人が変更します。');
if (row.special_price_standard) {
  console.log(`   固定価格: スタンダード ¥${row.special_price_standard}/kg・プレミアム ¥${row.special_price_premium}/kg（税抜）`);
} else {
  console.log('   数量ティア価格を適用');
}
console.log(
  row.delivery_method === 'hand_delivery'
    ? '   直接お届け（送料なし）'
    : row.free_shipping
      ? '   宅配便・送料は当社負担'
      : '   宅配便・送料は箱数分を加算',
);
