import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyOrderToTelegram } from '@/lib/telegram';
import { GrindOption, grindNote, withGrindNote } from '@/app/lib/grind';

export async function POST(request: NextRequest) {
  const squareToken = process.env.SQUARE_ACCESS_TOKEN!;
  const locationId = process.env.SQUARE_LOCATION_ID!;

  const {
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

  if (!email || !fullName || !items || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const orderId = `BT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const shippingAddress = `〒${postalCode} ${prefecture}${city}${streetAddress}${building ? ' ' + building : ''}`;

  // Create Square order
  const lineItems = items.map((item: { name: string; quantity: number; price: number; grind?: GrindOption }) => ({
    name: withGrindNote(item.name, item.grind),
    quantity: String(item.quantity || 1),
    base_price_money: { amount: 0, currency: 'JPY' },
    note: `銀行振込注文｜挽き方: ${grindNote(item.grind)}`,
  }));

  const orderPayload = {
    idempotency_key: orderId,
    order: {
      location_id: locationId,
      reference_id: orderId,
      customer_note: `銀行振込注文\n名前: ${fullName}\nメール: ${email}\n電話: ${phone}\n住所: ${shippingAddress}`,
      line_items: lineItems,
    },
  };

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
    console.error('Square order error (bank transfer):', result);
    return NextResponse.json({ error: 'Square order failed' }, { status: 500 });
  }

  const squareResult = await squareRes.json();
  console.log('Square bank transfer order created:', squareResult.order?.id);

  // Save to Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: dbError } = await supabase.from('orders').upsert({
    id: orderId,
    customer_name: fullName,
    customer_email: email,
    customer_phone: phone,
    shipping_address: shippingAddress,
    items,
    amount,
    status: 'pending_bank_transfer',
    payment_method: 'bank_transfer',
  });

  if (dbError) {
    console.error('Supabase insert error (bank transfer):', dbError);
    return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
  }

  await notifyOrderToTelegram({
    orderId,
    paymentMethod: 'bank_transfer',
    customerName: fullName,
    customerEmail: email,
    customerPhone: phone,
    shippingAddress,
    items,
    amount,
  });

  return NextResponse.json({ orderId, received: true });
}
