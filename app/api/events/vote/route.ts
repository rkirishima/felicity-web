import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { onEventConfirmed } from '@/app/lib/event-confirm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { event_id, voter_name, voter_email, votes } = await request.json();

    if (!event_id || !voter_name || !voter_email || !votes?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const email = voter_email.toLowerCase().trim();

    // Upsert each vote
    for (const vote of votes) {
      const { date_id, response } = vote;
      if (!date_id || !['yes', 'maybe', 'no'].includes(response)) continue;

      const { error } = await supabase
        .from('event_votes')
        .upsert(
          {
            event_date_id: date_id,
            event_id,
            voter_name,
            voter_email: email,
            response,
          },
          { onConflict: 'event_date_id,voter_email' }
        );

      if (error) {
        console.error('Vote upsert error:', error);
        return NextResponse.json({ error: 'Failed to save vote' }, { status: 500 });
      }
    }

    // Recalculate counts for affected dates
    const dateIds = votes.map((v: any) => v.date_id);
    for (const dateId of dateIds) {
      const { data: votesForDate } = await supabase
        .from('event_votes')
        .select('response')
        .eq('event_date_id', dateId);

      const yesCount = votesForDate?.filter((v) => v.response === 'yes').length || 0;
      const maybeCount = votesForDate?.filter((v) => v.response === 'maybe').length || 0;

      await supabase
        .from('event_dates')
        .update({ yes_count: yesCount, maybe_count: maybeCount })
        .eq('id', dateId);
    }

    // Check if any date reached the threshold
    const { data: event } = await supabase
      .from('events')
      .select('min_votes, status')
      .eq('id', event_id)
      .single();

    if (event && event.status === 'open') {
      const { data: dates } = await supabase
        .from('event_dates')
        .select('id, date, yes_count')
        .eq('event_id', event_id)
        .gte('yes_count', event.min_votes)
        .order('yes_count', { ascending: false })
        .limit(1);

      if (dates && dates.length > 0) {
        await supabase
          .from('events')
          .update({ status: 'confirmed', confirmed_date: dates[0].date })
          .eq('id', event_id);

        // Trigger integrations (staff schedule + Google Calendar)
        const { data: fullEvent } = await supabase
          .from('events')
          .select('id, title, title_en, description, confirmed_date')
          .eq('id', event_id)
          .single();

        if (fullEvent) {
          onEventConfirmed(fullEvent).catch(console.error);
        }
      }
    }

    // Return updated event with dates
    const { data: updated } = await supabase
      .from('events')
      .select('*, event_dates(*)')
      .eq('id', event_id)
      .single();

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Vote error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
