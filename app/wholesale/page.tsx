import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { WHOLESALE_COOKIE, verifySession } from '@/app/lib/wholesale-auth';
import type { SpecialPricing } from '@/app/lib/wholesale';
import { WholesaleOrder, type WholesaleAccount } from './WholesaleOrder';

// Reads a session cookie and per-account pricing — never cache this page.
export const dynamic = 'force-dynamic';

export default async function WholesalePage() {
  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(WHOLESALE_COOKIE)?.value);
  if (!session) redirect('/wholesale/login');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from('wholesale_accounts')
    .select(
      'code, company, contact_name, email, phone, postal_code, prefecture, city, street_address, building, special_price_economy, special_price_standard, special_price_premium, free_shipping, delivery_method, must_change_password, active'
    )
    .eq('code', session.code)
    .maybeSingle();

  // Deactivated or deleted between sign-in and now — drop them back to login
  // rather than serving a price sheet they no longer have access to.
  if (!data || !data.active) redirect('/wholesale/login');

  // 初期パスワードのままでは注文させない。取引先自身のパスワードに変えてもらう。
  if (data.must_change_password) redirect('/wholesale/password');

  const account: WholesaleAccount = {
    code: data.code,
    company: data.company,
    contactName: data.contact_name ?? '',
    email: data.email,
    phone: data.phone ?? '',
    postalCode: data.postal_code ?? '',
    prefecture: data.prefecture ?? '',
    city: data.city ?? '',
    streetAddress: data.street_address ?? '',
    building: data.building ?? '',
    specialPricing: (() => {
      const special: SpecialPricing = {};
      if (data.special_price_economy) special.economy = data.special_price_economy;
      if (data.special_price_standard) special.standard = data.special_price_standard;
      if (data.special_price_premium) special.premium = data.special_price_premium;
      return Object.keys(special).length > 0 ? special : null;
    })(),
    freeShipping: data.free_shipping,
    deliveryMethod: data.delivery_method === 'hand_delivery' ? 'hand_delivery' : 'shipping',
  };

  return <WholesaleOrder account={account} />;
}
