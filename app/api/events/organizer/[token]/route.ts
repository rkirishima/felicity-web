import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Light validation — Postgres uuid type would reject malformed input anyway,
// but bail early so we don't issue a query for obviously bogus tokens.
const TOKEN_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }

  const { data: event, error } = await supabase
    .from('events')
    .select(
      'id, title, title_en, description, description_en, status, confirmed_date, max_attendees, min_votes, external_url, event_dates(id, date, start_time, end_time, yes_count, maybe_count), event_votes(id, event_date_id, voter_name, voter_email, response, created_at)'
    )
    .eq('organizer_token', token)
    .maybeSingle();

  if (error) {
    console.error('Organizer fetch error:', error);
    return NextResponse.json({ error: 'Failed to load event' }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(event);
}
