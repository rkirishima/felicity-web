import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const squareToken = process.env.SQUARE_ACCESS_TOKEN!;
  const locationId = process.env.SQUARE_LOCATION_ID!;

  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({
      error: 'Webhook signature failed',
      debug: {
        secretPrefix: webhookSecret?.substring(0, 16) ?? 'MISSING',
        bodyLength: body.length,
        hasSignature: !!signature,
        errMsg: err.message,
      },
    }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const customerName = pi.metadata?.customer_name || '不明';
    const customerEmail = pi.metadata?.customer_email || pi.receipt_email || '';
    const customerPhone = pi.metadata?.customer_phone || '';
    const shippingAddress = pi.metadata?.shipping_address || '';
    const itemsRaw = pi.metadata?.items;
    const items = itemsRaw ? JSON.parse(itemsRaw) : [];
    const amountYen = pi.amount;

    const lineItems = items.length > 0
      ? items.map((item: { name: string; qty: number }) => ({
          name: item.name,
          quantity: String(item.qty || 1),
          base_price_money: { amount: 0, currency: 'JPY' },
          note: 'ECサイト注文',
        }))
      : [{
          name: `EC注文 ¥${amountYen}`,
          quantity: '1',
          base_price_money: { amount: 0, currency: 'JPY' },
        }];

    const orderPayload = {
      idempotency_key: pi.id,
      order: {
        location_id: locationId,
        reference_id: pi.id,
        customer_note: `ECサイト注文\n名前: ${customerName}\nメール: ${customerEmail}\n電話: ${customerPhone}\n住所: ${shippingAddress}`,
        line_items: lineItems,
        metadata: {
          stripe_payment_intent: pi.id,
          customer_email: pi.receipt_email || '',
        },
      },
    };

    const res = await fetch('https://connect.squareup.com/v2/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${squareToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify(orderPayload),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error('Square order error:', result);
      return NextResponse.json({ error: 'Square order failed' }, { status: 500 });
    }

    console.log('Square order created:', result.order?.id);

    // Save order to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error: dbError } = await supabase.from('orders').upsert({
      id: pi.id,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      shipping_address: shippingAddress,
      items,
      amount: amountYen,
      status: 'paid',
    });
    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
