import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-staff-key');
  return key === process.env.STAFF_API_KEY;
}

// GET all events (including closed/cancelled) for staff
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('events')
    .select('*, event_dates(*), event_votes(*)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST create event + candidate dates
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, title_en, description, description_en, photo, min_votes, dates } = await request.json();

    if (!title || !title_en) {
      return NextResponse.json({ error: 'Title required (ja + en)' }, { status: 400 });
    }

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title,
        title_en,
        description: description || null,
        description_en: description_en || null,
        photo: photo || null,
        min_votes: min_votes || 3,
      })
      .select()
      .single();

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    // Add candidate dates
    if (dates?.length) {
      const dateRows = dates.map((d: any) => ({
        event_id: event.id,
        date: d.date,
        start_time: d.start_time || null,
        end_time: d.end_time || null,
      }));

      const { error: datesError } = await supabase
        .from('event_dates')
        .insert(dateRows);

      if (datesError) {
        console.error('Date insert error:', datesError);
      }
    }

    // Return full event with dates
    const { data: full } = await supabase
      .from('events')
      .select('*, event_dates(*)')
      .eq('id', event.id)
      .single();

    return NextResponse.json(full);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH update event
export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, add_dates, remove_date_ids, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    // Update event fields
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Add new candidate dates
    if (add_dates?.length) {
      const rows = add_dates.map((d: any) => ({
        event_id: id,
        date: d.date,
        start_time: d.start_time || null,
        end_time: d.end_time || null,
      }));

      await supabase.from('event_dates').insert(rows);
    }

    // Remove candidate dates
    if (remove_date_ids?.length) {
      await supabase
        .from('event_dates')
        .delete()
        .in('id', remove_date_ids);
    }

    const { data } = await supabase
      .from('events')
      .select('*, event_dates(*), event_votes(*)')
      .eq('id', id)
      .single();

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE event
export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
