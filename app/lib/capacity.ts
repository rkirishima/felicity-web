import { SupabaseClient } from '@supabase/supabase-js';

interface FloorAvailability {
  total: number;
  reserved: number;
  eventBlocked: number;
  available: number;
}

export interface Availability {
  '1F': FloorAvailability;
  '2F': FloorAvailability;
}

/**
 * Add minutes to an HH:MM time string, returning HH:MM.
 */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Calculate seat availability per floor for a given date and time window.
 *
 * Queries:
 *   1. floor_capacity  -- total seats per floor
 *   2. event_instances  -- events that block seats (time_relation = 'during')
 *   3. reservations     -- pending/confirmed reservations that overlap
 */
export async function getAvailability(
  supabase: SupabaseClient,
  date: string,       // YYYY-MM-DD
  startTime: string,  // HH:MM
  endTime?: string    // HH:MM, defaults to startTime + 90min
): Promise<Availability> {
  const queryEnd = endTime || addMinutes(startTime, 90);

  // 1. Floor capacity
  const { data: floors, error: floorErr } = await supabase
    .from('floor_capacity')
    .select('floor, seats');

  if (floorErr) throw new Error(`floor_capacity query failed: ${floorErr.message}`);

  const capacity: Record<string, number> = {};
  for (const row of floors || []) {
    capacity[row.floor] = row.seats;
  }

  // Initialise result
  const result: Availability = {
    '1F': { total: capacity['1F'] || 0, reserved: 0, eventBlocked: 0, available: 0 },
    '2F': { total: capacity['2F'] || 0, reserved: 0, eventBlocked: 0, available: 0 },
  };

  // 2. Event instances that overlap and block seats
  //    Join with events to get time_relation, floor_block, seats_blocked
  const { data: eventInstances, error: eventErr } = await supabase
    .from('event_instances')
    .select('start_time, end_time, events(time_relation, floor_block, seats_blocked)')
    .eq('date', date);

  if (eventErr) throw new Error(`event_instances query failed: ${eventErr.message}`);

  for (const inst of eventInstances || []) {
    const event = inst.events as any;
    if (!event || event.time_relation !== 'during') continue;

    // Check time overlap: event overlaps if event.start_time < queryEnd AND event.end_time > queryStart
    const evStart = inst.start_time as string; // HH:MM(:SS)
    const evEnd = (inst.end_time as string) || addMinutes(evStart, 120);
    if (evStart >= queryEnd || evEnd <= startTime) continue;

    const floor = event.floor_block as string;
    if (!floor || !(floor in result)) continue;

    if ((event.seats_blocked || 0) === 0) {
      // Block entire floor
      result[floor as '1F' | '2F'].eventBlocked = result[floor as '1F' | '2F'].total;
    } else {
      result[floor as '1F' | '2F'].eventBlocked += event.seats_blocked;
    }
  }

  // 3. Reservations that overlap
  const { data: reservations, error: resErr } = await supabase
    .from('reservations')
    .select('time, end_time, party_size, floor_preference')
    .eq('date', date)
    .in('status', ['pending', 'confirmed']);

  if (resErr) throw new Error(`reservations query failed: ${resErr.message}`);

  for (const r of reservations || []) {
    const rStart = r.time as string;
    const rEnd = (r.end_time as string) || addMinutes(rStart, 90);
    // Overlap: rStart < queryEnd AND rEnd > queryStart
    if (rStart >= queryEnd || rEnd <= startTime) continue;

    const floor = r.floor_preference as string;
    const size = r.party_size as number;

    if (floor && floor in result) {
      result[floor as '1F' | '2F'].reserved += size;
    } else {
      // No floor preference -- split proportionally or assign to largest floor
      // Simple approach: assign to 1F first, overflow to 2F
      result['1F'].reserved += size;
    }
  }

  // Compute available
  for (const f of ['1F', '2F'] as const) {
    result[f].available = Math.max(
      0,
      result[f].total - result[f].eventBlocked - result[f].reserved
    );
  }

  return result;
}
