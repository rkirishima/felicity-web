import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// ── helpers ────────────────────────────────────────────────────────────────────

function jstDateString(offsetDays = 0): string {
  // YYYY-MM-DD in Asia/Tokyo, with day offset
  const ms = Date.now() + offsetDays * 86_400_000;
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date(ms));
}

function jstWeekday(): number {
  // 0=Sun, 1=Mon, ... 6=Sat (in JST)
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', weekday: 'short' }).format(new Date());
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[parts as 'Sun'] ?? 0;
}

function fmtDate(yyyymmdd: string): string {
  // 2026-06-06 → 6/6 (土)
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  const wd = new Intl.DateTimeFormat('ja-JP', { timeZone: 'UTC', weekday: 'short' }).format(new Date(Date.UTC(y, m - 1, d)));
  return `${m}/${d} (${wd})`;
}

function fmtTime(hhmmss: string | null): string {
  return (hhmmss || '').slice(0, 5);
}

async function sendTelegram(text: string): Promise<{ ok: boolean; err?: string }> {
  if (!BOT_TOKEN || !CHAT_ID) return { ok: false, err: 'missing env' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    const j = await res.json();
    return j.ok ? { ok: true } : { ok: false, err: j.description || 'unknown' };
  } catch (e: any) {
    return { ok: false, err: e.message };
  }
}

// ── route ──────────────────────────────────────────────────────────────────────

interface EventRow {
  id: string;
  title: string;
  status: string;
  min_votes: number | null;
  max_attendees: number | null;
  confirmed_date: string | null;
  event_dates: Array<{
    date: string;
    start_time: string | null;
    end_time: string | null;
    yes_count: number;
  }>;
}

export async function GET(request: NextRequest) {
  // Vercel Cron injects Authorization: Bearer ${CRON_SECRET}
  const auth = request.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = jstDateString(0);
  const tomorrow = jstDateString(1);
  const twoWeeks = jstDateString(14);
  const dow = jstWeekday();
  const isMonday = dow === 1;
  // Allow ?force=weekly|tomorrow to test manually
  const force = new URL(request.url).searchParams.get('force');

  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, status, min_votes, max_attendees, confirmed_date, event_dates(date, start_time, end_time, yes_count)')
    .eq('event_type', 'one_off')
    .in('status', ['confirmed', 'open'])
    .gte('confirmed_date', today)
    .lte('confirmed_date', twoWeeks)
    .order('confirmed_date');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const all = (events || []) as EventRow[];
  const sent: string[] = [];
  const skipped: string[] = [];

  // ── 1) Pre-event reminder: anything happening tomorrow ─────────────────────
  const tomorrowEvents = all.filter(e => e.confirmed_date === tomorrow);
  for (const e of tomorrowEvents) {
    const dates = e.event_dates.filter(d => d.date === tomorrow);
    const cap = e.max_attendees ? ` / ${e.max_attendees}名` : '';
    const slots = dates.length
      ? dates.map(d => `🕒 ${fmtTime(d.start_time)}–${fmtTime(d.end_time)}  参加 <b>${d.yes_count}名${cap}</b>`).join('\n')
      : `📅 ${fmtDate(tomorrow)}`;
    const msg = [
      `🔔 <b>明日のイベント</b>`,
      ``,
      `<b>${e.title}</b>`,
      `📅 ${fmtDate(tomorrow)}`,
      slots,
    ].join('\n');
    const r = await sendTelegram(msg);
    (r.ok ? sent : skipped).push(`tomorrow:${e.id}${r.ok ? '' : `(${r.err})`}`);
  }

  // ── 2) Weekly summary on Monday ────────────────────────────────────────────
  if (isMonday || force === 'weekly') {
    if (all.length > 0) {
      const lines = [
        `📅 <b>今週・来週のイベント</b>`,
        ``,
        ...all.map(e => {
          const total = e.event_dates.reduce((s, d) => s + (d.yes_count || 0), 0);
          const cap = e.max_attendees ? ` / ${e.max_attendees}名` : '';
          const slotCount = e.event_dates.length;
          const slotInfo = slotCount > 1 ? `  (時間枠${slotCount}つ)` : '';
          return `• <b>${fmtDate(e.confirmed_date!)}</b>  ${e.title}\n   参加 ${total}名${cap}${slotInfo}`;
        }),
      ].join('\n');
      const r = await sendTelegram(lines);
      (r.ok ? sent : skipped).push(`weekly${r.ok ? '' : `(${r.err})`}`);
    } else if (force === 'weekly') {
      const r = await sendTelegram('📅 今週・来週はフェリシティイベントの予定なし');
      (r.ok ? sent : skipped).push(`weekly-empty${r.ok ? '' : `(${r.err})`}`);
    }
  }

  return NextResponse.json({
    today,
    tomorrow,
    dow,
    isMonday,
    force,
    eventCount: all.length,
    sent,
    skipped,
  });
}
