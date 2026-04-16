import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const squareToken = process.env.SQUARE_ACCESS_TOKEN!;
  const locationId = process.env.SQUARE_LOCATION_ID!;

  const {
    paymentIntentId,
    email,
    fullName,
    phone,
    postalCode,
    prefecture,
    city,
    streetAddress,
    building,
    items,
    amount,
  } = await request.json();

  if (!paymentIntentId || !email || !fullName || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify with Stripe that payment actually succeeded
  let pi: Stripe.PaymentIntent;
  try {
    pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    return NextResponse.json({ error: 'Invalid payment intent' }, { status: 400 });
  }

  if (pi.status !== 'succeeded') {
    return NextResponse.json({ error: 'Payment not confirmed' }, { status: 400 });
  }

  const shippingAddress = `〒${postalCode} ${prefecture}${city}${streetAddress}${building ? ' ' + building : ''}`;
  const orderItems = items?.map((i: { name: string; qty: number }) => ({ name: i.name, qty: i.qty || 1 })) || [];

  // --- Square Order with fulfillment ---
  const lineItems = orderItems.length > 0
    ? orderItems.map((item: { name: string; qty: number }) => ({
        name: item.name,
        quantity: String(item.qty),
        base_price_money: { amount: 0, currency: 'JPY' },
        note: 'ECサイト注文',
      }))
    : [{
        name: `EC注文 ¥${amount}`,
        quantity: '1',
        base_price_money: { amount: 0, currency: 'JPY' },
      }];

  const orderPayload = {
    idempotency_key: paymentIntentId,
    order: {
      location_id: locationId,
      reference_id: paymentIntentId,
      customer_note: `ECサイト注文\n名前: ${fullName}\nメール: ${email}\n電話: ${phone}\n住所: ${shippingAddress}`,
      line_items: lineItems,
      fulfillments: [{
        type: 'SHIPMENT',
        state: 'PROPOSED',
        shipment_details: {
          recipient: {
            display_name: fullName,
            email_address: email,
            phone_number: phone,
            address: {
              address_line_1: `${prefecture}${city}${streetAddress}`,
              address_line_2: building || undefined,
              locality: city,
              administrative_district_level_1: prefecture,
              postal_code: postalCode.replace('-', ''),
              country: 'JP',
            },
          },
        },
      }],
    },
  };

  try {
    const squareRes = await fetch('https://connect.squareup.com/v2/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${squareToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!squareRes.ok) {
      const result = await squareRes.json().catch(() => ({}));
      console.error('Square order error:', result);
    } else {
      const result = await squareRes.json();
      console.log('Square order created:', result.order?.id);
    }
  } catch (err) {
    console.error('Square request failed:', err);
  }

  // --- Supabase ---
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: dbError } = await supabase.from('orders').upsert({
    id: paymentIntentId,
    customer_name: fullName,
    customer_email: email,
    customer_phone: phone,
    shipping_address: shippingAddress,
    items: orderItems,
    amount,
    status: 'paid',
    payment_method: 'stripe',
  });

  if (dbError) {
    console.error('Supabase insert error:', dbError);
    return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
  }

  // --- Order Confirmation Email ---
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const itemsHtml = orderItems
        .map((i: { name: string; qty: number }) => `<li>${i.name} × ${i.qty}</li>`)
        .join('');

      await resend.emails.send({
        from: 'FELICITY <orders@felicity.cafe>',
        to: email,
        subject: '【FELICITY】ご注文ありがとうございます',
        html: `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="border-bottom: 2px solid #1c1917; padding-bottom: 16px; margin-bottom: 24px;">
    <p style="font-size: 13px; letter-spacing: 0.2em; color: #78716c; margin: 0;">FELICITY COFFEE ROASTERS</p>
  </div>

  <p style="font-size: 15px; line-height: 1.7;">${fullName} 様</p>
  <p style="font-size: 15px; line-height: 1.7;">
    この度はご注文いただきありがとうございます。<br>
    以下の内容でご注文を承りました。
  </p>

  <div style="background: #f5f0e8; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <p style="font-size: 12px; color: #78716c; margin: 0 0 4px; letter-spacing: 0.1em;">注文番号</p>
    <p style="font-size: 14px; font-weight: bold; margin: 0; letter-spacing: 0.02em; word-break: break-all;">${paymentIntentId}</p>
  </div>

  <div style="margin: 24px 0;">
    <p style="font-size: 12px; color: #78716c; margin: 0 0 8px; letter-spacing: 0.1em;">ご注文内容</p>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">${itemsHtml}</ul>
    <p style="font-size: 16px; font-weight: bold; margin: 12px 0 0; color: #1c1917;">合計: ¥${amount.toLocaleString()}</p>
  </div>

  <div style="margin: 24px 0;">
    <p style="font-size: 12px; color: #78716c; margin: 0 0 4px; letter-spacing: 0.1em;">お届け先</p>
    <p style="font-size: 14px; line-height: 1.7; margin: 0;">${shippingAddress}</p>
  </div>

  <p style="font-size: 14px; line-height: 1.7; color: #555;">
    商品の発送準備が整い次第、追跡番号をメールでお知らせいたします。<br>
    ご不明な点がございましたら、お気軽にご連絡ください。
  </p>

  <div style="border-top: 1px solid #e5e5e5; margin-top: 32px; padding-top: 16px;">
    <p style="font-size: 12px; color: #78716c; line-height: 1.7; margin: 0;">
      FELICITY COFFEE ROASTERS<br>
      〒240-0112 神奈川県三浦郡葉山町上山口2432-3<br>
      hello@felicity.cafe
    </p>
  </div>
</body>
</html>`,
      });
      console.log('Order confirmation email sent to:', email);
    } catch (emailErr) {
      console.error('Order confirmation email failed:', emailErr);
      // Don't fail the order — email is secondary
    }
  }

  return NextResponse.json({ orderId: paymentIntentId, received: true });
}
