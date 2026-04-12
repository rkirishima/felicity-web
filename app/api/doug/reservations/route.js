import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('date', date)
    .order('time');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ reservations: data || [] });
}

export async function PATCH(request) {
  const { id, status } = await request.json();

  if (!id || !status) {
    return Response.json({ error: 'Missing id or status' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ reservation: data });
}
