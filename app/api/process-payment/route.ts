import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const body = await request.json();
    const { amount, currency = 'jpy', email, fullName, items, phone, postalCode, prefecture, city, streetAddress, building } = body;

    if (!amount || !email) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency,
      receipt_email: email,
      metadata: {
        customer_name: fullName || '',
        customer_email: email || '',
        customer_phone: phone || '',
        items: JSON.stringify(items?.map((i: any) => ({ name: i.name, qty: i.quantity ?? 1 })) || []),
        shipping_address: `${postalCode} ${prefecture}${city}${streetAddress}${building ? ' ' + building : ''}`,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Stripe API error:', error);
    return NextResponse.json(
      { message: error.message || 'Payment processing failed' },
      { status: 400 }
    );
  }
}
