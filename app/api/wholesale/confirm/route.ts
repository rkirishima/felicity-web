import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { notifyWholesaleOrderToTelegram } from '@/lib/telegram';
import { createSquareWholesaleOrder, currentAccount, serviceClient } from '@/app/lib/wholesale-server';

export async function POST(request: NextRequest) {
  const supabase = serviceClient();
  const account = await currentAccount(supabase);
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId, paymentIntentId } = await request.json().catch(() => ({}));
  if (!orderId || !paymentIntentId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Scoped to the signed-in account so one customer can't confirm another's order.
  const { data: order } = await supabase
    .from('wholesale_orders')
    .select('*')
    .eq('id', orderId)
    .eq('account_code', account.code)
    .maybeSingle();

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.payment_intent_id !== paymentIntentId) {
    return NextResponse.json({ error: 'Payment mismatch' }, { status: 400 });
  }

  // Already confirmed — the webhook or a retried request got here first.
  if (order.status === 'paid') {
    return NextResponse.json({ ok: true, orderId, alreadyConfirmed: true });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  let pi: Stripe.PaymentIntent;
  try {
    pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    return NextResponse.json({ error: 'Invalid payment intent' }, { status: 400 });
  }

  if (pi.status !== 'succeeded' || pi.amount !== order.amount) {
    return NextResponse.json({ error: 'Payment not confirmed' }, { status: 400 });
  }

  const squareOrderId = await createSquareWholesaleOrder({
    orderId: order.id,
    company: order.company,
    contactName: order.contact_name,
    email: order.email,
    phone: order.phone,
    shippingAddress: order.shipping_address,
    lines: order.items,
    paymentMethod: 'card',
    note: order.note,
  });

  await supabase
    .from('wholesale_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      square_order_id: squareOrderId ?? order.square_order_id,
    })
    .eq('id', order.id);

  await notifyWholesaleOrderToTelegram({
    orderId: order.id,
    paymentMethod: 'card',
    company: order.company,
    contactName: order.contact_name,
    email: order.email,
    phone: order.phone,
    shippingAddress: order.shipping_address,
    lines: order.items,
    totalKg: order.total_kg,
    totalGreenKg: order.total_green_kg,
    subtotal: order.subtotal,
    amount: order.amount,
    note: order.note,
  });

  return NextResponse.json({ ok: true, orderId: order.id });
}
