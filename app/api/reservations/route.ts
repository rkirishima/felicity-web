import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { name, date, time, party_size, contact, floor_preference, notes } = await request.json();

    if (!name || !date || !time || !party_size || !contact) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        name,
        date,
        time,
        party_size,
        contact,
        floor_preference: floor_preference || null,
        notes: notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Reservation insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save reservation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, reservation: data });
  } catch (err: any) {
    console.error('Reservation error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}
