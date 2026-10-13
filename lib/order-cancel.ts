// 銀行振込注文のキャンセルリンク用トークン。
// 注文番号は推測可能なので、HMAC 署名付きのリンクでのみキャンセルを受け付ける。
// Env: ORDER_CANCEL_SECRET（未設定時は SUPABASE_SERVICE_ROLE_KEY から派生）。

import { createHmac, timingSafeEqual } from 'crypto';

function secret(): string {
  const s = process.env.ORDER_CANCEL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('ORDER_CANCEL_SECRET not set');
  return s;
}

export function signCancelToken(orderId: string): string {
  return createHmac('sha256', secret()).update(`cancel:${orderId}`).digest('base64url');
}

export function verifyCancelToken(orderId: string, token: string): boolean {
  const expected = Buffer.from(signCancelToken(orderId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function cancelUrl(orderId: string): string {
  const q = new URLSearchParams({ id: orderId, t: signCancelToken(orderId) });
  return `https://felicity.cafe/order/cancel?${q}`;
}
