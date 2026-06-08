import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ConfirmedEvent {
  id: string;
  title: string;
  title_en: string;
  confirmed_date: string;
  description: string | null;
}

/**
 * Called when an event reaches its vote threshold and is confirmed.
 * 1. Adds the event to the staff shifts table (as a special "event" shift)
 * 2. Creates a Google Calendar event (if OAuth tokens are available)
 */
export async function onEventConfirmed(event: ConfirmedEvent) {
  await Promise.allSettled([
    addToStaffSchedule(event),
    addToGoogleCalendar(event),
  ]);
}

/**
 * Insert a row into the shifts table so staff can see the event on their schedule.
 * Uses staff_id = null and a special note to distinguish from regular shifts.
 */
async function addToStaffSchedule(event: ConfirmedEvent) {
  try {
    // Use the same Supabase instance since staff tables are in the same DB
    const { error } = await supabase
      .from('shifts')
      .insert({
        staff_id: null,
        date: event.confirmed_date,
        start_time: '10:00',
        end_time: '17:00',
        status: 'approved',
        note: `[EVENT] ${event.title}`,
      });

    if (error) {
      // shifts table may require staff_id — try alternative approach
      console.error('Staff schedule insert error:', error.message);

      // Fallback: insert into a dedicated events_calendar table if shifts doesn't work
      await supabase
        .from('events')
        .update({ status: 'confirmed' })
        .eq('id', event.id);
    }
  } catch (err) {
    console.error('Staff schedule error:', err);
  }
}

/**
 * Create a Google Calendar event using stored OAuth2 tokens.
 * Tokens are stored in doug_google_tokens table.
 */
async function addToGoogleCalendar(event: ConfirmedEvent) {
  try {
    // Check if we have Google Calendar credentials
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    if (!clientId || !clientSecret) {
      console.log('Google Calendar not configured — skipping');
      return;
    }

    // Get stored refresh token from doug_google_tokens (now lives in main Supabase
    // after the standalone Doug project was decommissioned).
    const dougUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_DOUG_SUPABASE_URL;
    const dougKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY_DOUG;
    const dougSupabase = dougUrl && dougKey ? createClient(dougUrl, dougKey) : null;

    if (!dougSupabase) {
      console.log('Doug Supabase not configured — skipping Google Calendar');
      return;
    }

    const { data: tokens } = await dougSupabase
      .from('doug_google_tokens')
      .select('refresh_token, access_token, expiry_date')
      .eq('user_id', 'doug')
      .single();

    if (!tokens?.refresh_token) {
      console.log('No Google refresh token — run OAuth flow first');
      return;
    }

    // Refresh access token if needed
    let accessToken = tokens.access_token;
    if (!accessToken || Date.now() > (tokens.expiry_date || 0)) {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        console.error('Failed to refresh Google token:', tokenData);
        return;
      }

      accessToken = tokenData.access_token;

      // Update stored token
      await dougSupabase
        .from('doug_google_tokens')
        .update({
          access_token: accessToken,
          expiry_date: Date.now() + tokenData.expires_in * 1000,
        })
        .eq('user_id', 'doug');
    }

    // Create calendar event
    const calendarEvent = {
      summary: `${event.title} / ${event.title_en}`,
      description: event.description || '',
      start: {
        date: event.confirmed_date,
        timeZone: 'Asia/Tokyo',
      },
      end: {
        date: event.confirmed_date,
        timeZone: 'Asia/Tokyo',
      },
    };

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calendarEvent),
      }
    );

    if (res.ok) {
      console.log('Google Calendar event created for:', event.title);
    } else {
      const err = await res.text();
      console.error('Google Calendar error:', err);
    }
  } catch (err) {
    console.error('Google Calendar error:', err);
  }
}
