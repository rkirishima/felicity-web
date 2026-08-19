import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { MIN_ORDER_KG, isHandDelivery, quote } from '@/app/lib/wholesale';
import { notifyWholesaleOrderToTelegram } from '@/lib/telegram';
import {
  createSquareWholesaleOrder,
  currentAccount,
  serviceClient,
  specialPricingOf,
  termsOf,
} from '@/app/lib/wholesale-server';

export async function POST(request: NextRequest) {
  const supabase = serviceClient();
  const account = await currentAccount(supabase);
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const {
    items,
    paymentMethod,
    contactName,
    email,
    phone,
    postalCode,
    prefecture,
    city,
    streetAddress,
    building,
    note,
  } = body;

  if (paymentMethod !== 'bank_transfer' && paymentMethod !== 'card') {
    return NextResponse.json({ error: 'お支払い方法を選択してください。' }, { status: 400 });
  }
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: '銘柄と数量をご指定ください。' }, { status: 400 });
  }
  const terms = termsOf(account);
  const handDelivery = isHandDelivery(terms);

  if (!contactName || !email) {
    return NextResponse.json({ error: 'ご担当者名とメールアドレスを入力してください。' }, { status: 400 });
  }
  if (!handDelivery && (!postalCode || !prefecture || !city || !streetAddress)) {
    return NextResponse.json({ error: '配送先をすべて入力してください。' }, { status: 400 });
  }

  // Prices are recomputed here from the account record. Anything the browser
  // sent about money is ignored.
  const q = quote(items, specialPricingOf(account), terms);

  if (q.totalKg < MIN_ORDER_KG) {
    return NextResponse.json({ error: `ご注文は${MIN_ORDER_KG}kgから承ります。` }, { status: 400 });
  }

  const orderId = `WS-${account.code}-${Date.now().toString(36).toUpperCase()}`;
  // 手渡しの取引先は住所を持たないので、発送してしまわないよう記録側でも明示する。
  const shippingAddress = handDelivery
    ? '直接お届け（配送不要）'
    : `〒${postalCode} ${prefecture}${city}${streetAddress}${building ? ` ${building}` : ''}`;

  let clientSecret: string | null = null;
  let paymentIntentId: string | null = null;

  if (paymentMethod === 'card') {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: q.total,
        currency: 'jpy',
        receipt_email: email,
        metadata: {
          // The retail webhook keys off this to stay out of wholesale orders.
          order_type: 'wholesale',
          wholesale_order_id: orderId,
          account_code: account.code,
          company: account.company,
        },
      });
      clientSecret = paymentIntent.client_secret;
      paymentIntentId = paymentIntent.id;
    } catch (err) {
      console.error('[wholesale] Stripe PaymentIntent failed:', err);
      return NextResponse.json({ error: 'お支払いの準備に失敗しました。' }, { status: 500 });
    }
  }

  const { error: dbError } = await supabase.from('wholesale_orders').insert({
    id: orderId,
    account_code: account.code,
    company: account.company,
    contact_name: contactName,
    email,
    phone: phone || null,
    shipping_address: shippingAddress,
    items: q.lines,
    total_kg: q.totalKg,
    total_green_kg: q.totalGreenKg,
    tier_label: q.tier.label,
    special_pricing: q.usesSpecialPricing,
    subtotal: q.subtotal,
    shipping: q.shipping,
    tax_goods: q.taxGoods,
    tax_shipping: q.taxShipping,
    amount: q.total,
    payment_method: paymentMethod,
    status: paymentMethod === 'card' ? 'pending_payment' : 'pending_bank_transfer',
    payment_intent_id: paymentIntentId,
    note: note || null,
  });

  if (dbError) {
    console.error('[wholesale] order insert failed:', dbError);
    return NextResponse.json({ error: '注文の保存に失敗しました。' }, { status: 500 });
  }

  // A card order isn't real until it's paid — Square and Telegram wait for
  // /api/wholesale/confirm.
  if (paymentMethod === 'bank_transfer') {
    const squareOrderId = await createSquareWholesaleOrder({
      orderId,
      company: account.company,
      contactName,
      email,
      phone,
      shippingAddress,
      lines: q.lines,
      paymentMethod,
      note,
    });
    if (squareOrderId) {
      await supabase.from('wholesale_orders').update({ square_order_id: squareOrderId }).eq('id', orderId);
    }

    await notifyWholesaleOrderToTelegram({
      orderId,
      paymentMethod,
      company: account.company,
      contactName,
      email,
      phone,
      shippingAddress,
      lines: q.lines,
      totalKg: q.totalKg,
      totalGreenKg: q.totalGreenKg,
      subtotal: q.subtotal,
      amount: q.total,
      note,
    });
  }

  return NextResponse.json({ orderId, amount: q.total, clientSecret });
}
