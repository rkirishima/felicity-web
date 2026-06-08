import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Hide events whose confirmed_date is in the past (JST). Day-after auto-hide:
    // an event on YYYY-MM-DD stays visible all day, disappears at JST midnight.
    const todayJST = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());

    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, title_en, description, description_en, photo, min_votes, max_attendees, status, confirmed_date, external_url, created_at, event_dates(*)')
      .in('status', ['open', 'confirmed', 'full'])
      .eq('event_type', 'one_off')
      .or(`confirmed_date.is.null,confirmed_date.gte.${todayJST}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Events fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json(events || []);
  } catch (err: any) {
    console.error('Events error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
