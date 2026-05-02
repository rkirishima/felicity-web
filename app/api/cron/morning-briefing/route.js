import { NextResponse } from 'next/server';
import { morningBriefing } from '../../../../doug/server.js';

export const maxDuration = 60;

// Called by Vercel Cron at 8am JST (23:00 UTC).
// Vercel secures cron routes automatically in production —
// manual CRON_SECRET check adds defence-in-depth for local testing.
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const reply = await morningBriefing('doug');
    console.log('[cron] Morning briefing sent:', reply.slice(0, 100));
    return NextResponse.json({ ok: true, preview: reply.slice(0, 200) });
  } catch (err) {
    console.error('[cron] Morning briefing failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
