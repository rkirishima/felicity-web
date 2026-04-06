import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const PRICE_IDS: Record<string, string | undefined> = {
  small:  process.env.STRIPE_PRICE_SUB_S,
  medium: process.env.STRIPE_PRICE_SUB_M,
  large:  process.env.STRIPE_PRICE_SUB_L,
};

export async function POST(request: NextRequest) {
  const { plan } = await request.json();
  const priceId = PRICE_IDS[plan];

  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan or price not configured' }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const origin = request.headers.get('origin') ?? 'https://felicity.cafe';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/subscribe`,
    locale: 'ja',
    subscription_data: {
      metadata: { plan },
    },
  });

  return NextResponse.json({ url: session.url });
}
