import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAvailability } from '../../lib/capacity';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    const partySizeStr = searchParams.get('party_size');
    const floor = searchParams.get('floor');

    if (!date || !time) {
      return NextResponse.json(
        { error: 'Missing required parameters: date, time' },
        { status: 400 }
      );
    }

    const partySize = partySizeStr ? parseInt(partySizeStr, 10) : 1;
    const availability = await getAvailability(supabase, date, time);

    let canBook = false;
    if (floor && (floor === '1F' || floor === '2F')) {
      canBook = availability[floor as '1F' | '2F'].available >= partySize;
    } else {
      // Can book if any floor has room
      canBook =
        availability['1F'].available >= partySize ||
        availability['2F'].available >= partySize;
    }

    return NextResponse.json({ availability, canBook });
  } catch (err: any) {
    console.error('Availability error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}
