import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, title_en, description, description_en, photo, min_votes, status, confirmed_date, created_at, event_dates(*)')
      .in('status', ['open', 'confirmed'])
      .eq('event_type', 'one_off')
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
