// Password hashing and session signing for the wholesale (業販) area.
//
// Uses Web Crypto only — no native modules — because the same `verifySession`
// runs inside `proxy.ts` as well as in route handlers, and proxy code must not
// depend on a Node-only runtime.
//
// Trade accounts each get their own code + password (see the
// `wholesale_accounts` table) so a leaked password invalidates one customer
// rather than exposing the whole price sheet.

const PBKDF2_ITERATIONS = 210_000;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Constant-time comparison — a length mismatch still walks the longer input so
// the timing does not reveal where the difference is.
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

// --- Passwords ----------------------------------------------------------

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' }, key, 256);
  return new Uint8Array(bits);
}

// Stored form: `pbkdf2$<iterations>$<salt>$<hash>` (both base64url).
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 1000) return false;
  const hash = await pbkdf2(password, fromBase64Url(parts[2]), iterations);
  return timingSafeEqual(hash, fromBase64Url(parts[3]));
}

// --- Sessions -----------------------------------------------------------

export const WHOLESALE_COOKIE = 'felicity_wholesale';

export type WholesaleSession = {
  code: string;
  company: string;
  exp: number; // unix seconds
};

// 署名鍵は WHOLESALE_SESSION_SECRET。未設定なら本番に必ず存在する
// SUPABASE_SERVICE_ROLE_KEY にフォールバックする（felicity-staff の
// lib/auth/session.ts と同じ方針で、デプロイ時に新規 env を必要としない）。
// 鍵はサーバー外に出ず、cookie に載るのは HMAC の結果だけ。
function sessionSecret(): string | null {
  return process.env.WHOLESALE_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

export async function signSession(session: Omit<WholesaleSession, 'exp'>, ttlSeconds = SESSION_TTL_SECONDS): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const payload: WholesaleSession = { ...session, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const body = toBase64Url(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body)));
  return `${body}.${toBase64Url(sig)}`;
}

// Returns null for anything not currently valid: missing secret, malformed
// token, bad signature, or expired.
export async function verifySession(token: string | undefined | null): Promise<WholesaleSession | null> {
  const secret = sessionSecret();
  if (!secret || !token) return null;

  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body)));
  if (!timingSafeEqual(expected, fromBase64Url(sig))) return null;

  try {
    const payload = JSON.parse(dec.decode(fromBase64Url(body))) as WholesaleSession;
    if (!payload?.code || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
