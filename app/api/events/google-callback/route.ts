import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { onEventConfirmed } from '@/app/lib/event-confirm';

/**
 * GET /api/events/google-callback
 * Handles the OAuth2 redirect from Google.
 * Exchanges the code for tokens and stores the refresh_token.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error: `OAuth error: ${error}` }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET!;
  const redirectUri = `${new URL(request.url).origin}/api/events/google-callback`;

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokens.access_token) {
    return NextResponse.json({ error: 'Token exchange failed', details: tokens }, { status: 500 });
  }

  // Store tokens in doug_google_tokens (lives in main Supabase since the
  // standalone Doug project was decommissioned).
  const dougUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_DOUG_SUPABASE_URL;
  const dougKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY_DOUG;

  if (!dougUrl || !dougKey) {
    return NextResponse.json({
      error: 'Supabase not configured',
      tokens: { refresh_token: tokens.refresh_token },
    });
  }

  const dougSupabase = createClient(dougUrl, dougKey);

  await dougSupabase
    .from('doug_google_tokens')
    .upsert({
      user_id: 'doug',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: Date.now() + tokens.expires_in * 1000,
    });

  // Backfill: sync any events that were confirmed before OAuth was wired up.
  const todayJST = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
  const { data: pending } = await dougSupabase
    .from('events')
    .select('id, title, title_en, description, confirmed_date')
    .in('status', ['confirmed', 'full'])
    .is('google_calendar_event_id', null)
    .not('confirmed_date', 'is', null)
    .gte('confirmed_date', todayJST);

  const backfilled = pending?.length || 0;
  if (pending?.length) {
    await Promise.allSettled(pending.map((e: any) => onEventConfirmed(e)));
  }

  return new NextResponse(`
    <html>
      <body style="font-family: sans-serif; padding: 40px; background: #F4EFE4; color: #2C2416;">
        <h2>Google Calendar connected!</h2>
        <p>Events will now be automatically added to your Google Calendar when confirmed.</p>
        ${backfilled > 0 ? `<p>${backfilled} existing confirmed event${backfilled === 1 ? '' : 's'} synced to your calendar.</p>` : ''}
        <p>You can close this tab.</p>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' },
  });
}
