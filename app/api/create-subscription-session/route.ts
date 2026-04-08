import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const PRICE_IDS: Record<string, string | undefined> = {
  small:  process.env.STRIPE_PRICE_SUB_S,
  medium: process.env.STRIPE_PRICE_SUB_M,
  large:  process.env.STRIPE_PRICE_SUB_L,
};

export async function POST(request: NextRequest) {
  let plan: string | undefined;

  try {
    const body = await request.json();
    plan = body?.plan;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!plan || typeof plan !== 'string') {
    return NextResponse.json({ error: 'Missing required field: plan' }, { status: 400 });
  }

  const priceId = PRICE_IDS[plan];

  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan or price not configured' }, { status: 400 });
  }

  try {
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
  } catch (error: any) {
    console.error('Stripe subscription session error:', error);
    const isStripeError = error?.type && typeof error.type === 'string' && error.type.startsWith('Stripe');
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription session' },
      { status: isStripeError ? 400 : 500 }
    );
  }
}
