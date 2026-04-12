import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/events/google-auth
 * Redirects to Google OAuth consent screen.
 * Run this once to authorize calendar write access.
 */
export async function GET(request: NextRequest) {
  const staffKey = request.headers.get('x-staff-key') || new URL(request.url).searchParams.get('key');
  if (staffKey !== process.env.STAFF_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_CALENDAR_CLIENT_ID not set' }, { status: 500 });
  }

  const redirectUri = `${new URL(request.url).origin}/api/events/google-callback`;
  const scope = 'https://www.googleapis.com/auth/calendar.events';

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  return NextResponse.redirect(authUrl.toString());
}
