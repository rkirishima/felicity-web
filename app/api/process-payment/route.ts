import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const body = await request.json();
    const { amount, currency = 'jpy', email, fullName, items, phone, postalCode, prefecture, city, streetAddress, building } = body;

    if (!amount || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || !email) {
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
        items: JSON.stringify(items?.map((i: any) => ({ id: i.id, name: i.name, qty: i.quantity ?? 1 })) || []),
        shipping_address: `${postalCode} ${prefecture}${city}${streetAddress}${building ? ' ' + building : ''}`,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Stripe API error:', error);
    const isStripeError = error?.type && typeof error.type === 'string' && error.type.startsWith('Stripe');
    return NextResponse.json(
      { message: error.message || 'Payment processing failed' },
      { status: isStripeError ? 400 : 500 }
    );
  }
}
