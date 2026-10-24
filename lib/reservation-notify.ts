// New-reservation fan-out: Telegram notice + Google Calendar entry.
//
// Telegram: same orders bot/group as EC orders (TELEGRAM_ORDERS_BOT_TOKEN /
//   TELEGRAM_ORDERS_CHAT_ID), or a dedicated group via TELEGRAM_RESERVATIONS_CHAT_ID.
// Calendar: the shared "フェリシティ" calendar by default
//   (GOOGLE_RESERVATIONS_CALENDAR_ID overrides). Uses the OAuth refresh token
//   stored in doug_google_tokens by /api/events/google-auth → google-callback.
//
// Never throws — a notification failure must not break the booking.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type Reservation = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  end_time?: string | null;
  party_size: number;
  contact: string;
  floor_preference?: string | null;
  notes?: string | null;
  source?: string | null;
};

const DEFAULT_CALENDAR_ID = 'aberdeenstudio.ar@gmail.com'; // フェリシティ
const DEFAULT_DURATION_MIN = 90;

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key) : null;
}

function dateLabel(date: string): string {
  const [, m, day] = date.split('-').map(Number);
  return `${m}/${day}(${WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()]})`;
}

function sourceLabel(s?: string | null): string {
  if (s === 'chatbot') return 'Webチャット';
  if (s === 'web') return 'Web';
  if (s === 'phone') return '電話';
  return s || 'Web';
}

function addMinutes(time: string, min: number): string {
  const [h, m] = time.split(':').map(Number);
  const t = h * 60 + m + min;
  const hh = Math.min(Math.floor(t / 60), 23);
  const mm = hh === 23 && t >= 24 * 60 ? 59 : t % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export async function onReservationCreated(r: Reservation): Promise<void> {
  await Promise.allSettled([notifyTelegram(r), syncCalendar(r)]);
}

async function notifyTelegram(r: Reservation): Promise<void> {
  const token = process.env.TELEGRAM_ORDERS_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_RESERVATIONS_CHAT_ID || process.env.TELEGRAM_ORDERS_CHAT_ID;
  if (!token || !chatId) {
    console.warn('[reservation] Telegram not configured — skipping');
    return;
  }

  const lines = [
    `🪑 新規予約（${sourceLabel(r.source)}）`,
    '',
    `${dateLabel(r.date)} ${r.time}〜  ${r.party_size}名`,
    `名前: ${r.name}`,
    `連絡先: ${r.contact}`,
  ];
  if (r.floor_preference) lines.push(`希望: ${r.floor_preference}`);
  if (r.notes) lines.push(`備考: ${r.notes}`);
  lines.push('', `ID: ${r.id.slice(0, 8)}（未確定）`);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines.join('\n') }),
    });
    if (!res.ok) console.error('[reservation] Telegram failed:', res.status, await res.text().catch(() => ''));
  } catch (err) {
    console.error('[reservation] Telegram error:', err);
  }
}

export async function getGoogleAccessToken(supabase: SupabaseClient): Promise<string | null> {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const { data: tokens } = await supabase
    .from('doug_google_tokens')
    .select('refresh_token, access_token, expiry_date')
    .eq('user_id', 'doug')
    .maybeSingle();
  if (!tokens?.refresh_token) {
    console.warn('[reservation] No Google refresh token — open /api/events/google-auth once');
    return null;
  }

  if (tokens.access_token && Date.now() < (tokens.expiry_date || 0) - 60_000) return tokens.access_token;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const t = await res.json();
  if (!t.access_token) {
    console.error('[reservation] Google token refresh failed:', t);
    return null;
  }
  await supabase
    .from('doug_google_tokens')
    .update({ access_token: t.access_token, expiry_date: Date.now() + t.expires_in * 1000 })
    .eq('user_id', 'doug');
  return t.access_token;
}

async function syncCalendar(r: Reservation): Promise<void> {
  try {
    const supabase = db();
    if (!supabase) return;
    const accessToken = await getGoogleAccessToken(supabase);
    if (!accessToken) return;

    const calendarId = process.env.GOOGLE_RESERVATIONS_CALENDAR_ID || DEFAULT_CALENDAR_ID;
    const end = r.end_time || addMinutes(r.time, DEFAULT_DURATION_MIN);
    const desc = [
      `人数: ${r.party_size}名`,
      `連絡先: ${r.contact}`,
      r.floor_preference ? `希望フロア: ${r.floor_preference}` : '',
      r.notes ? `備考: ${r.notes}` : '',
      `経路: ${sourceLabel(r.source)}`,
      `予約ID: ${r.id}`,
    ].filter(Boolean).join('\n');

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: `🪑予約 ${r.name}様 ${r.party_size}名${r.floor_preference ? ` (${r.floor_preference})` : ''}`,
          description: desc,
          start: { dateTime: `${r.date}T${r.time}:00`, timeZone: 'Asia/Tokyo' },
          end: { dateTime: `${r.date}T${end}:00`, timeZone: 'Asia/Tokyo' },
        }),
      }
    );
    if (!res.ok) {
      console.error('[reservation] Calendar error:', await res.text());
      return;
    }
    const ev = await res.json();
    if (ev.id) await supabase.from('reservations').update({ google_calendar_event_id: ev.id }).eq('id', r.id);
  } catch (err) {
    console.error('[reservation] Calendar error:', err);
  }
}
