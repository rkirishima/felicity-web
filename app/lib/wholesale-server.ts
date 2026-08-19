// Server-side helpers shared by the wholesale order and confirm routes.
//
// Both routes need the same three things: the signed-in account, a price
// recomputed from that account (never from the browser), and the fulfilment
// side-effects once an order becomes real.

import { cookies } from 'next/headers';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { WHOLESALE_COOKIE, verifySession } from '@/app/lib/wholesale-auth';
import type { DeliveryMethod, QuoteTerms, SpecialPricing } from '@/app/lib/wholesale';

export type AccountRecord = {
  code: string;
  company: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  special_price_economy: number | null;
  special_price_standard: number | null;
  special_price_premium: number | null;
  free_shipping: boolean;
  delivery_method: DeliveryMethod;
  active: boolean;
};

export function serviceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Resolves the signed-in trade account. `proxy.ts` already rejects requests
// without a session; this re-check exists so a route is never authorised by
// proxy alone, and so the account row is re-read (a deactivated customer stops
// ordering immediately rather than at cookie expiry).
export async function currentAccount(
  supabase: SupabaseClient
): Promise<AccountRecord | null> {
  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(WHOLESALE_COOKIE)?.value);
  if (!session) return null;

  const { data } = await supabase
    .from('wholesale_accounts')
    .select(
      'code, company, contact_name, email, phone, special_price_economy, special_price_standard, special_price_premium, free_shipping, delivery_method, active'
    )
    .eq('code', session.code)
    .maybeSingle();

  if (!data || !data.active) return null;
  return data as AccountRecord;
}

export function specialPricingOf(account: AccountRecord): SpecialPricing | null {
  const special: SpecialPricing = {};
  if (account.special_price_economy) special.economy = account.special_price_economy;
  if (account.special_price_standard) special.standard = account.special_price_standard;
  if (account.special_price_premium) special.premium = account.special_price_premium;
  return Object.keys(special).length > 0 ? special : null;
}

export function termsOf(account: AccountRecord): QuoteTerms {
  return { freeShipping: account.free_shipping, deliveryMethod: account.delivery_method };
}

// Mirrors the retail flow: orders are echoed into Square as a record, with the
// money left at zero so wholesale revenue isn't double-counted against Stripe.
// Supabase remains the source of truth for invoicing.
export async function createSquareWholesaleOrder(params: {
  orderId: string;
  company: string;
  contactName?: string | null;
  email?: string;
  phone?: string | null;
  shippingAddress: string;
  lines: { name: string; kg: number }[];
  paymentMethod: string;
  note?: string;
}): Promise<string | null> {
  const squareToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!squareToken || !locationId) {
    console.warn('[wholesale] Square not configured — skipping order echo');
    return null;
  }

  const methodLabel = params.paymentMethod === 'bank_transfer' ? '銀行振込' : 'カード決済';

  const payload = {
    idempotency_key: params.orderId,
    order: {
      location_id: locationId,
      reference_id: params.orderId,
      customer_note: [
        `業販注文（${methodLabel}）`,
        `取引先: ${params.company}`,
        params.contactName ? `担当: ${params.contactName}` : null,
        params.email ? `メール: ${params.email}` : null,
        params.phone ? `電話: ${params.phone}` : null,
        `配送先: ${params.shippingAddress}`,
        params.note ? `備考: ${params.note}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      line_items: params.lines.map((l) => ({
        name: `【業販】${l.name}`,
        quantity: String(l.kg),
        base_price_money: { amount: 0, currency: 'JPY' },
        note: `${l.kg}kg（業販・${methodLabel}）`,
      })),
    },
  };

  try {
    const res = await fetch('https://connect.squareup.com/v2/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${squareToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error('[wholesale] Square order failed:', await res.text());
      return null;
    }
    const result = await res.json();
    return result.order?.id ?? null;
  } catch (err) {
    // Square is a bookkeeping echo, not the order itself — never fail the order.
    console.error('[wholesale] Square order error:', err);
    return null;
  }
}
