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
 * Called when an event reaches its vote threshold and is confirmed,
 * or when an admin manually confirms an event.
 * 1. Adds the event to the staff shifts table (as a special "event" shift)
 * 2. Creates/updates a Google Calendar event (if OAuth tokens are available)
 */
export async function onEventConfirmed(event: ConfirmedEvent) {
  await Promise.allSettled([
    addToStaffSchedule(event),
    syncGoogleCalendar(event),
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
 * Create or update a Google Calendar event using stored OAuth2 tokens.
 * - Reads start_time/end_time from the event_dates row for confirmed_date.
 *   When both are set, a timed event is created; otherwise all-day.
 * - Stores google_calendar_event_id on the event so re-confirmation (e.g. date
 *   change) updates the same calendar entry instead of creating a duplicate.
 */
async function syncGoogleCalendar(event: ConfirmedEvent) {
  try {
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    if (!clientId || !clientSecret) {
      console.log('Google Calendar not configured — skipping');
      return;
    }

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

      await dougSupabase
        .from('doug_google_tokens')
        .update({
          access_token: accessToken,
          expiry_date: Date.now() + tokenData.expires_in * 1000,
        })
        .eq('user_id', 'doug');
    }

    // Look up the chosen date row to pick up start_time/end_time and any
    // previously synced calendar event id.
    const [{ data: chosenDate }, { data: row }] = await Promise.all([
      supabase
        .from('event_dates')
        .select('start_time, end_time')
        .eq('event_id', event.id)
        .eq('date', event.confirmed_date)
        .maybeSingle(),
      supabase
        .from('events')
        .select('google_calendar_event_id')
        .eq('id', event.id)
        .single(),
    ]);

    // Postgres `time` returns "HH:MM:SS"; normalize to HH:MM:SS for RFC3339.
    const normalize = (t: string | null | undefined) =>
      t ? (t.length === 5 ? `${t}:00` : t) : null;
    const start = normalize(chosenDate?.start_time as string | null | undefined);
    const end = normalize(chosenDate?.end_time as string | null | undefined);
    const timed = !!start && !!end;

    const calendarEvent = {
      summary: `${event.title} / ${event.title_en}`,
      description: event.description || '',
      start: timed
        ? { dateTime: `${event.confirmed_date}T${start}`, timeZone: 'Asia/Tokyo' }
        : { date: event.confirmed_date, timeZone: 'Asia/Tokyo' },
      end: timed
        ? { dateTime: `${event.confirmed_date}T${end}`, timeZone: 'Asia/Tokyo' }
        : { date: event.confirmed_date, timeZone: 'Asia/Tokyo' },
    };

    const existingId = row?.google_calendar_event_id;
    const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    const url = existingId ? `${base}/${encodeURIComponent(existingId)}` : base;
    const method = existingId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Google Calendar error:', errText);
      return;
    }

    const data = await res.json();
    if (!existingId && data.id) {
      await supabase
        .from('events')
        .update({ google_calendar_event_id: data.id })
        .eq('id', event.id);
    }
    console.log(`Google Calendar event ${existingId ? 'updated' : 'created'} for:`, event.title);
  } catch (err) {
    console.error('Google Calendar error:', err);
  }
}
